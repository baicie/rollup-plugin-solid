import { transformAsync, TransformOptions } from '@babel/core';
import ts from '@babel/preset-typescript';
import type { FilterPattern } from '@rollup/pluginutils';
import { createFilter } from '@rollup/pluginutils';
import solid from 'babel-preset-solid';
import { mergeAndConcat } from 'merge-anything';
import type { Plugin } from 'rollup';

export interface ExtensionOptions {
  typescript?: boolean;
}

export interface Options {
  /**
   * A [picomatch](https://github.com/micromatch/picomatch) pattern, or array of patterns, which specifies the files
   * the plugin should operate on.
   */
  include?: FilterPattern;
  /**
   * A [picomatch](https://github.com/micromatch/picomatch) pattern, or array of patterns, which specifies the files
   * to be ignored by the plugin.
   */
  exclude?: FilterPattern;
  /**
 * Pass any additional [babel-plugin-jsx-dom-expressions](https://github.com/ryansolid/dom-expressions/tree/main/packages/babel-plugin-jsx-dom-expressions#plugin-options).
 * They will be merged with the defaults sets by [babel-preset-solid](https://github.com/solidjs/solid/blob/main/packages/babel-preset-solid/index.js#L8-L25).
 *
 * @default {}
 */
  solid: {


    /**
     * Removed unnecessary closing tags from template strings. More info here:
     * https://github.com/solidjs/solid/blob/main/CHANGELOG.md#smaller-templates
     *
     * @default false
     */
    omitNestedClosingTags: boolean;

    /**
     * The name of the runtime module to import the methods from.
     *
     * @default "solid-js/web"
     */
    moduleName?: string;

    /**
     * The output mode of the compiler.
     * Can be:
     * - "dom" is standard output
     * - "ssr" is for server side rendering of strings.
     * - "universal" is for using custom renderers from solid-js/universal
     *
     * @default "dom"
     */
    generate?: 'ssr' | 'dom' | 'universal';

    /**
     * Indicate whether the output should contain hydratable markers.
     *
     * @default false
     */
    hydratable?: boolean;

    /**
     * Boolean to indicate whether to enable automatic event delegation on camelCase.
     *
     * @default true
     */
    delegateEvents?: boolean;

    /**
     * Boolean indicates whether smart conditional detection should be used.
     * This optimizes simple boolean expressions and ternaries in JSX.
     *
     * @default true
     */
    wrapConditionals?: boolean;

    /**
     * Boolean indicates whether to set current render context on Custom Elements and slots.
     * Useful for seemless Context API with Web Components.
     *
     * @default true
     */
    contextToCustomElements?: boolean;

    /**
     * Array of Component exports from module, that aren't included by default with the library.
     * This plugin will automatically import them if it comes across them in the JSX.
     *
     * @default ["For","Show","Switch","Match","Suspense","SuspenseList","Portal","Index","Dynamic","ErrorBoundary"]
     */
    builtIns?: string[];
  };
  /**
 * This registers additional extensions that should be processed by
 * vite-plugin-solid.
 *
 * @default undefined
 */
  extensions?: (string | [string, ExtensionOptions])[];
  typescript: {
    /**
     * Forcibly enables jsx parsing. Otherwise angle brackets will be treated as
     * typescript's legacy type assertion var foo = <string>bar;. Also, isTSX:
     * true requires allExtensions: true.
     *
     * @default false
     */
    isTSX?: boolean;

    /**
     * Replace the function used when compiling JSX expressions. This is so that
     * we know that the import is not a type import, and should not be removed.
     *
     * @default React
     */
    jsxPragma?: string;

    /**
     * Replace the function used when compiling JSX fragment expressions. This
     * is so that we know that the import is not a type import, and should not
     * be removed.
     *
     * @default React.Fragment
     */
    jsxPragmaFrag?: string;

    /**
     * Indicates that every file should be parsed as TS or TSX (depending on the
     * isTSX option).
     *
     * @default false
     */
    allExtensions?: boolean;

    /**
     * Enables compilation of TypeScript namespaces.
     *
     * @default uses the default set by @babel/plugin-transform-typescript.
     */
    allowNamespaces?: boolean;

    /**
     * When enabled, type-only class fields are only removed if they are
     * prefixed with the declare modifier:
     *
     * > NOTE: This will be enabled by default in Babel 8
     *
     * @default false
     *
     * @example
     * ```ts
     * class A {
     *   declare foo: string; // Removed
     *   bar: string; // Initialized to undefined
     *    prop?: string; // Initialized to undefined
     *    prop1!: string // Initialized to undefined
     * }
     * ```
     */
    allowDeclareFields?: boolean;

    /**
     * When set to true, the transform will only remove type-only imports
     * (introduced in TypeScript 3.8). This should only be used if you are using
     * TypeScript >= 3.8.
     *
     * @default false
     */
    onlyRemoveTypeImports?: boolean;

    /**
     * When set to true, Babel will inline enum values rather than using the
     * usual enum output:
     *
     * This option differs from TypeScript's --isolatedModules behavior, which
     * ignores the const modifier and compiles them as normal enums, and aligns
     * Babel's behavior with TypeScript's default behavior.
     *
     * ```ts
     *  // Input
     *  const enum Animals {
     *    Fish
     *  }
     *  console.log(Animals.Fish);
     *
     *  // Default output
     *  var Animals;
     *
     *  (function (Animals) {
     *    Animals[Animals["Fish"] = 0] = "Fish";
     *  })(Animals || (Animals = {}));
     *
     *  console.log(Animals.Fish);
     *
     *  // `optimizeConstEnums` output
     *  console.log(0);
     * ```
     *
     * However, when exporting a const enum Babel will compile it to a plain
     * object literal so that it doesn't need to rely on cross-file analysis
     * when compiling it:
     *
     * ```ts
     * // Input
     * export const enum Animals {
     *   Fish,
     * }
     *
     * // `optimizeConstEnums` output
     * export var Animals = {
     *     Fish: 0,
     * };
     * ```
     *
     * @default false
     */
    optimizeConstEnums?: boolean;
  };
  /**
   * Pass any additional babel transform options. They will be merged with
   * the transformations required by Solid.
   *
   * @default {}
   */
  babel:
  | TransformOptions
  | ((source: string, id: string, ssr: boolean) => TransformOptions)
  | ((source: string, id: string, ssr: boolean) => Promise<TransformOptions>);
}

function getExtension(filename: string): string {
  const index = filename.lastIndexOf('.');
  return index < 0 ? '' : filename.substring(index).replace(/\?.+$/, '');
}

export default (options: Partial<Options> = {}): Plugin => {
  const filter = createFilter(options.include, options.exclude);

  let projectRoot = process.cwd();
  return {
    name: 'solid-js',
    async transform(source, id,) {
      const currentFileExtension = getExtension(id);

      const extensionsToWatch = [...(options.extensions || []), '.tsx', '.jsx'];
      const allExtensions = extensionsToWatch.map((extension) =>
        // An extension can be a string or a tuple [extension, options]
        typeof extension === 'string' ? extension : extension[0],
      );

      if (!filter(id) || !allExtensions.includes(currentFileExtension)) {
        return null;
      }

      const solidOptions = { generate: 'dom', hydratable: true };

      id = id.replace(/\?.+$/, '');

      const opts: TransformOptions = {
        babelrc: false,
        configFile: false,
        root: projectRoot,
        filename: id,
        sourceFileName: id,
        presets: [[solid, { ...solidOptions, ...(options.solid || {}) }]],
        plugins: [],
        sourceMaps: true,
      };

      const shouldBeProcessedWithTypescript = extensionsToWatch.some((extension) => {
        if (typeof extension === 'string') {
          return extension.includes('tsx');
        }

        const [extensionName, extensionOptions] = extension;
        if (extensionName !== currentFileExtension) return false;

        return extensionOptions.typescript;
      });

      if (shouldBeProcessedWithTypescript) {
        opts.presets.push([ts, options.typescript || {}]);
      }

      let babelUserOptions: TransformOptions = {};

      if (options.babel) {
        if (typeof options.babel === 'function') {
          const babelOptions = options.babel(source, id, false);
          babelUserOptions = babelOptions instanceof Promise ? await babelOptions : babelOptions;
        } else {
          babelUserOptions = options.babel;
        }
      }

      const babelOptions = mergeAndConcat(babelUserOptions, opts) as TransformOptions;

      const { code, map } = await transformAsync(source, babelOptions);

      return { code, map };
    }
  } as Plugin;
}