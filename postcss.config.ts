import postcssNested from 'postcss-nested';
import { type Plugin, type Processor } from 'postcss';

interface PostCSSConfig {
  plugins: (Processor | Plugin)[];
}

const config: PostCSSConfig = {
  plugins: [postcssNested()],
};

export default config;
