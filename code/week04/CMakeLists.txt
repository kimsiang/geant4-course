cmake_minimum_required(VERSION 3.16)
project(Week04 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

find_package(Geant4 REQUIRED ui_all vis_all)
include(${Geant4_USE_FILE})

file(GLOB sources CONFIGURE_DEPENDS ${PROJECT_SOURCE_DIR}/src/*.cc)
file(GLOB headers CONFIGURE_DEPENDS ${PROJECT_SOURCE_DIR}/include/*.hh)

add_executable(week04 week04.cc ${sources} ${headers})
target_include_directories(week04 PRIVATE include)
target_link_libraries(week04 PRIVATE ${Geant4_LIBRARIES})

foreach(_f run_bethe_bloch.mac vis.mac plot_bethe.py)
  configure_file(${PROJECT_SOURCE_DIR}/${_f} ${PROJECT_BINARY_DIR}/${_f} COPYONLY)
endforeach()
