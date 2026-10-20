# Proposal / 提案: <one-line title / 一行标题>

Author · date · repository URL · tag
作者 · 日期 · 仓库地址 · 标签

## 1. Question (one sentence) / 问题（一句话）
<What physical quantity do you want to learn, and to what precision?>
<你想得到哪个物理量，精度多少？>

## 2. Observable / 可观测量
<The one number the simulation will produce. Units. How it is computed from the ROOT file.>
<模拟将给出的那一个数字。单位。如何从 ROOT 文件算出。>

## 3. Prediction / 预测
<Direction and rough size, BEFORE running, with the reasoning (chapter / formula).>
<在运行之前写下变化方向和大致大小，并给出理由（章节 / 公式）。>

## 4. Virtual detector and physics / 虚拟探测器与物理
- Geometry and materials / 几何与材料: <...>
- Primary particles (spectrum, angles, position) / 初级粒子（能谱、角度、位置）: <...>
- Physics list and any added constructor / 物理列表及添加的构造器: <...>  (check with /process/list / 用 /process/list 检查)
- Detector response / 探测器响应: <truth Edep / digitised / optical>  and why that fidelity is enough / 以及为什么这个保真度足够

## 5. Skills used (at least three weeks) / 用到的技能（至少三周）
<e.g. W5 trigger, W8 analysis chain, W10 spin physics / 例如 第 5 周触发、第 8 周分析链、第 10 周自旋物理>

## 6. Validation criterion / 验证标准
<Reference (analytic, table, published measurement), the rung you aim for (Week 11 validation ladder),
and the discrepancy in sigma that would count as agreement.>
<参照（解析式、表格、已发表测量）、你瞄准的层级（第 11 周验证阶梯），以及多少 sigma 的偏差算一致。>

## 7. Feasibility / 可行性
- Target precision / 目标精度: <...>   systematic floor / 系统误差下限: <...>
- Events per configuration / 每个配置的事例数: <...>   configurations / 配置数: <...>
- CPU time per event from a pilot run / 试跑测得的每事例 CPU 时间: <... ms>   wall time on <N> cores / <N> 核上的墙钟时间: <...>

## 8. Boundary statement / 边界声明
<At least one physically important effect deliberately ignored, and its consequence.
If musrSim: one application-specific behaviour checked against the installed source.>
<至少一个被有意忽略的重要物理效应及其后果。若用 musrSim：一个对照已安装源码核实过的应用特有行为。>

## 9. Reproducibility record / 可复现性记录
- Geant4 version (geant4-config --version), ROOT / Python package versions / Geant4 版本、ROOT / Python 包版本
- Commit and tag; macro(s); seed strategy and thread count / 提交与标签；宏文件；种子策略与线程数
- Analysis command that prints the headline number, and its statistical tolerance / 打印核心数字的分析命令及其统计容差
