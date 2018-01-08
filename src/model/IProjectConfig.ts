/**
 * 配置文件结构接口
 *
 * @export
 * @class IProjectConfig
 */
export interface IProjectConfig {
  /**
   * 项目类型
   *
   * @type {("node" | "webpack" | "angular")}
   * @memberof IProjectConfig
   */
  projectType: "node" | "webpack" | "angular";

  /**
   * 此项目是否是命令行
   * 1、boolean: 当有true时，以项目名作为命令行；当false或为null时，不作为命令行使用
   * 2、string: 命令行名称
   * 3、string[]: 多个命令行名称
   * 
   * @type {(boolean | string | string[])}
   * @memberof IProjectConfig
   */
  command?: boolean | string | string[];

  /**
   * 是否生成文档
   *
   * @type {boolean}
   * @memberof IProjectConfig
   */
  documents?: boolean;

  /**
   * 是否需要单元测试
   * 
   * @type {boolean}
   * @memberof IProjectConfig
   */
  unitTest?: boolean;
}
