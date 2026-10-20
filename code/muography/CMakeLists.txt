cmake_minimum_required(VERSION 3.16)
project(Muography LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

find_package(Geant4 REQUIRED ui_all vis_all)
include(${Geant4_USE_FILE})

file(GLOB sources CONFIGURE_DEPENDS ${PROJECT_SOURCE_DIR}/src/*.cc)
file(GLOB headers CONFIGURE_DEPENDS ${PROJECT_SOURCE_DIR}/include/*.hh)

add_executable(muography muography.cc ${sources} ${headers})
target_include_directories(muography PRIVATE include)
target_link_libraries(muography PRIVATE ${Geant4_LIBRARIES})

foreach(_f quick.mac void_off.mac void_on.mac vis.mac analyse.py)
  configure_file(${PROJECT_SOURCE_DIR}/${_f} ${PROJECT_BINARY_DIR}/${_f} COPYONLY)
endforeach()
