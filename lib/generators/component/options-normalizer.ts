import { inject, injectable } from 'inversify';
import path from 'path';
import { IEnvAnalyzer } from '../../analyzers/env/interface';
import { IStylingAnalyzer } from '../../analyzers/styling/interface';
import { TOKENS } from '../../ioc/tokens';
import { IGenerateComponentOptions as IOptions } from './interface';

@injectable()
export class ComponentGeneratorOptionsNormalizer {
  constructor(
    @inject(TOKENS.envAnalyzer) private envAnalyzer: IEnvAnalyzer,
    @inject(TOKENS.styleAnlz) private styleAnalyzer: IStylingAnalyzer
  ) {}
  async normalize(args: IOptions): Promise<IOptions> {
    const opts: IOptions = { ...args };
    const srcDir = await this.envAnalyzer.determineSourceDir();
    if (!opts.style && !opts.nostyle) {
      opts.style = await this.styleAnalyzer.determineStylingStrategy();
    }
    // TODO:: needs testing
    if (opts.dir) {
      if (!path.isAbsolute(opts.dir)) {
        if (opts.dir.startsWith('.')) {
          opts.dir = path.join(process.cwd(), opts.dir);
        } else {
          opts.dir = path.join(srcDir, opts.dir);
        }
      }
    } else {
      const componentsDir = await this.envAnalyzer.determineComponentsDir();
      if (componentsDir) {
        opts.dir = componentsDir;
      } else {
        opts.dir = srcDir;
      }
    }
    if (!opts.js && !opts.ts) {
      const lang = await this.envAnalyzer.determineLang();
      opts.js = lang === 'js';
      opts.ts = lang === 'ts';
    }
    return opts;
  }
}
