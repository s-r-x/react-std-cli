import type { Arguments, CommandBuilder } from 'yargs';
import type { ComponentGenerator } from '../../generators/component';
import container from '../../ioc/container';
import { TOKENS } from '../../ioc/tokens';
import type { TStylingStrategy } from '../../typings/styling';
import type { IGenerateComponentOptions as IOptions } from '../../generators/component/interface';

export const command = 'component <name> [dir]';
export const aliases = ['c'];
export const desc = 'Generate component';

const styleChoices: TStylingStrategy[] = [
  'styled-components',
  'emotion',
  'aphrodite',
  'radium',
  'styled-jsx',
  'linaria',
  'less',
  'css',
  'stylus',
  'sass',
];
export const builder: CommandBuilder<IOptions, IOptions> = yargs =>
  yargs
    .options({
      ts: { type: 'boolean', desc: 'Use typescript?' },
      js: { type: 'boolean', desc: 'Use javascript?' },
      cc: { type: 'boolean', desc: 'Class component?' },
      fc: { type: 'boolean', desc: 'Functional component?' },
      mobx: { type: 'boolean', desc: 'Use mobx?' },
      redux: { type: 'boolean', desc: 'Use redux?' },
      ugly: { type: 'boolean', desc: 'Disable styling?' },
      sb: { type: 'boolean', desc: 'Create stories?' },
      test: { type: 'boolean', desc: 'Create tests?' },
      pure: { type: 'boolean', desc: 'Wrap in memo or extends PureComponent?' },
      tag: { type: 'string', desc: 'JSX root tag', default: 'div', alias: 't' },
      cssmodules: { type: 'boolean', desc: 'Use CSS modules?', alias: 'cssm' },
      style: {
        type: 'string',
        alias: 's',
        choices: styleChoices,
      },
      'prop-types': { type: 'boolean', desc: 'Use prop-types?', alias: 'PT' },
    })
    .positional('name', {
      type: 'string',
      demandOption: true,
      desc: 'Name of the component',
    })
    .positional('dir', {
      type: 'string',
      demandOption: true,
      desc: 'Directory to create the component',
    });

export const handler = async (argv: Arguments<IOptions>): Promise<void> => {
  const generator = container.get<ComponentGenerator>(TOKENS.cmpGen);
  await generator.gen(argv);
  process.exit(0);
};
