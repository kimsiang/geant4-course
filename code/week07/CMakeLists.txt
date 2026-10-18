cmake_minimum_required(VERSION 3.16)
project(Week07 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

find_package(Geant4 REQUIRED ui_all vis_all)
include(${Geant4_USE_FILE})

file(GLOB sources CONFIGURE_DEPENDS ${PROJECT_SOURCE_DIR}/src/*.cc)
file(GLOB headers CONFIGURE_DEPENDS ${PROJECT_SOURCE_DIR}/include/*.hh)

add_executable(week07 week07.cc ${sources} ${headers})
target_include_directories(week07 PRIVATE include)
target_link_libraries(week07 PRIVATE ${Geant4_LIBRARIES})

foreach(_f spectrometer.mac vis.mac reconstruct.py)
  configure_file(${PROJECT_SOURCE_DIR}/${_f} ${PROJECT_BINARY_DIR}/${_f} COPYONLY)
endforeach()
