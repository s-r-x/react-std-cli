import { inject, injectable } from 'inversify';
import {
  IComponentBuilderFacade,
  IComponentGeneratorSpec,
} from '../../builders/component/interface';
import {
  IStyleBuildArtifacts,
  TStyleBuilderFactory,
} from '../../builders/style/interface';
import { TOKENS } from '../../ioc/tokens';
import { IComponentGenInputNormalizer } from '../../normalizers/component-gen-input/interface';
import { TStylingStrategy } from '../../typings/styling';
import { Maybe, TStringDict } from '../../typings/utils';
import { IComponentGenerator, IGenerateComponentOptions } from './interface';
import _ from 'lodash';
import path from 'path';
import { IComponentTestsBuilder } from '../../builders/component-tests/interface';
import { IFileWriter } from '../../writers/file/interface';

@injectable()
export class ComponentGenerator implements IComponentGenerator {
  constructor(
    @inject(TOKENS.styBldrFctry)
    private styleBuilderFactory: TStyleBuilderFactory,
    @inject(TOKENS.cmpGenInputNrmlz)
    private inputNormalizer: IComponentGenInputNormalizer,
    @inject(TOKENS.componentBuilderFacade)
    private componentBuilder: IComponentBuilderFacade,
    @inject(TOKENS.fileWriter) private fileWriter: IFileWriter,
    @inject(TOKENS.componentTestsBuilder)
    private componentTestsBuilder: IComponentTestsBuilder
  ) {}
  async gen(rawOpts: IGenerateComponentOptions): Promise<void> {
    const { componentBuilder: builder } = this;
    const opts = await this.inputNormalizer.normalize(rawOpts);
    const styleArtifacts = this.genStyleArtifacts(opts);
    const component = builder.buildUsingComponentGeneratorSpec(
      this.genComponentBuilderSpec(opts, styleArtifacts)
    );
    const tests = this.genTests(opts);
    const filesList = this.genWritableFilesList(
      opts,
      component,
      styleArtifacts,
      tests
    );
    for (const file in filesList) {
      await this.fileWriter.write({
        path: file,
        content: filesList[file],
        shouldPromptOnOverride: true,
        shouldFormat: true,
      });
    }
  }
  private genWritableFilesList(
    opts: IGenerateComponentOptions,
    component: string,
    style: Maybe<IStyleBuildArtifacts>,
    tests: Maybe<string>
  ): TStringDict {
    const rootDir = path.join(opts.dir!, opts.name);
    const ext = opts.ts ? 'tsx' : 'jsx';
    return {
      [path.join(rootDir, `index.${ext}`)]: component,
      ...(tests && {
        [path.join(rootDir, `spec.${ext}`)]: tests,
      }),
      ...(style?.standalone && {
        [path.join(rootDir, style.standalone.filename)]:
          style.standalone.content,
      }),
    };
  }
  private genTests(opts: IGenerateComponentOptions): Maybe<string> {
    if (!opts.test) return null;
    return this.componentTestsBuilder.build({
      name: opts.name,
      importPath: './index.tsx',
    });
  }
  private genStyleArtifacts(
    opts: IGenerateComponentOptions
  ): Maybe<IStyleBuildArtifacts> {
    if (opts.style && !opts.nostyle) {
      return this.styleBuilderFactory(opts.style as TStylingStrategy).build({
        rootTag: opts.tag,
        ts: opts.ts,
      });
    }
    return null;
  }
  private genComponentBuilderSpec(
    opts: IGenerateComponentOptions,
    style: Maybe<IStyleBuildArtifacts>
  ): IComponentGeneratorSpec {
    return {
      ..._.pick(opts, [
        'name',
        'fc',
        'class',
        'ts',
        'tag',
        'mobx',
        'redux',
        'pure',
      ]),
      imports: style?.imports,
      hocs: style?.hocs,
      jsx: style?.jsx,
    };
  }
}
