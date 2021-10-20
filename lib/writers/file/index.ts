import { inject, injectable } from 'inversify';
import type { ICliUi } from '../../cli-ui/interface';
import type { ICodeFormatter } from '../../code-formatter/interface';
import type { IFileSystem } from '../../file-system/interface';
import { TOKENS } from '../../ioc/tokens';
import type { IFileWriter, IWriteFileSpec } from './interface';
import path from 'path';

@injectable()
export class FileWriter implements IFileWriter {
  constructor(
    @inject(TOKENS.fs) private fs: IFileSystem,
    @inject(TOKENS.cliUi) private ui: ICliUi,
    @inject(TOKENS.codeFormatter) private codeFormatter: ICodeFormatter
  ) {}
  async write(spec: IWriteFileSpec): Promise<boolean> {
    if (spec.shouldPromptOnOverride && (await this.fs.isExists(spec.path))) {
      const isOverrideConfirmed = await this.ui.confirm({
        message: `${path.relative(
          process.cwd(),
          spec.path
        )} already exists. Override?`,
        initial: false,
      });
      if (!isOverrideConfirmed) return false;
    }
    const finalContent = spec.shouldFormat
      ? await this.codeFormatter.format(spec.content, {
          ext: path.extname(spec.path),
        })
      : spec.content;
    await this.fs.writeFile(spec.path, finalContent);
    return true;
  }
}
