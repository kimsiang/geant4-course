# Geant4 2.0 course environment: Geant4 11.4 (multithreaded, with datasets) + Python analysis stack.
#
#   docker build -t g4c:11.4 .                       # about 30-60 min, image about 6 GB
#   docker run --rm -it -v "$PWD":/work g4c:11.4      # then: cd /work/code/week02 ...
#
# Builds Geant4 from the official source release. Written to the standard Geant4
# install guide; check the README before relying on it for a cohort.
FROM ubuntu:24.04

ARG G4_VERSION=11.4.1
ARG JOBS=4
ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential cmake wget ca-certificates git \
        libexpat1-dev zlib1g-dev \
        python3 python3-venv python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Geant4: source release from the CERN GitLab, datasets downloaded at build time
RUN wget -q https://gitlab.cern.ch/geant4/geant4/-/archive/v${G4_VERSION}/geant4-v${G4_VERSION}.tar.gz \
    && tar xzf geant4-v${G4_VERSION}.tar.gz \
    && cmake -S geant4-v${G4_VERSION} -B g4build \
        -DCMAKE_INSTALL_PREFIX=/opt/geant4 \
        -DCMAKE_BUILD_TYPE=Release \
        -DGEANT4_BUILD_MULTITHREADED=ON \
        -DGEANT4_INSTALL_DATA=ON \
        -DGEANT4_USE_QT=OFF \
        -DGEANT4_USE_OPENGL_X11=OFF \
    && cmake --build g4build -j ${JOBS} \
    && cmake --install g4build \
    && rm -rf geant4-v${G4_VERSION} g4build geant4-v${G4_VERSION}.tar.gz

# Python analysis stack in a virtual environment
COPY requirements.txt /opt/requirements.txt
RUN python3 -m venv /opt/g4c && /opt/g4c/bin/pip install --no-cache-dir -r /opt/requirements.txt

# Every shell gets Geant4 and the venv
RUN echo '. /opt/geant4/bin/geant4.sh' >> /etc/bash.bashrc \
    && echo '. /opt/g4c/bin/activate' >> /etc/bash.bashrc
ENV PATH=/opt/g4c/bin:/opt/geant4/bin:$PATH
WORKDIR /work
CMD ["bash"]
