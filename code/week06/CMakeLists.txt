cmake_minimum_required(VERSION 3.16)
project(Week06 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

find_package(Geant4 REQUIRED)
include(${Geant4_USE_FILE})

file(GLOB sources CONFIGURE_DEPENDS ${PROJECT_SOURCE_DIR}/src/*.cc)
file(GLOB headers CONFIGURE_DEPENDS ${PROJECT_SOURCE_DIR}/include/*.hh)

add_executable(week06 week06.cc ${sources} ${headers})
target_include_directories(week06 PRIVATE include)
target_link_libraries(week06 PRIVATE ${Geant4_LIBRARIES})

foreach(_mac census.mac cuts.mac)
  configure_file(${PROJECT_SOURCE_DIR}/${_mac} ${PROJECT_BINARY_DIR}/${_mac} COPYONLY)
endforeach()
