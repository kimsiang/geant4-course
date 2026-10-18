cmake_minimum_required(VERSION 3.16)
project(Week02 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

find_package(Geant4 REQUIRED ui_all vis_all)
include(${Geant4_USE_FILE})

file(GLOB sources CONFIGURE_DEPENDS ${PROJECT_SOURCE_DIR}/src/*.cc)
file(GLOB headers CONFIGURE_DEPENDS ${PROJECT_SOURCE_DIR}/include/*.hh)

add_executable(week02 week02.cc ${sources} ${headers})
target_include_directories(week02 PRIVATE include)
target_link_libraries(week02 PRIVATE ${Geant4_LIBRARIES})

# copy the macros next to the executable
foreach(_mac run1.mac mission1.mac outward.mac pion.mac vis.mac)
  configure_file(${PROJECT_SOURCE_DIR}/${_mac} ${PROJECT_BINARY_DIR}/${_mac} COPYONLY)
endforeach()
