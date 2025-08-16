// SPDX-License-Identifier: GPL-3.0-or-later

import * as fs from "node:fs/promises";
import * as path from "node:path";

export const getAllModulesSuffixPosix = "**/*";
export const getAllModulesSuffixWindows = "**\\*";

export function removePrivateJsdocImports() {
   return {
      name: "remove-private-jsdoc-imports",
      renderChunk(code, chunk, options) {
         return code.replace(/[ \t]*\/\*\*[^]*?\*\/[ \t]*\r?\n?/g, (match) => {
            return (match.includes("import(") || options.compact) ? "" : match;
         });
      }
   }
}

export function removeMatches(match) {
   return {
      name: "remove-matches",
      renderChunk(code) {
         return code.replaceAll(match, "");
      }
   }
}

export function copyAsset(sourcePath, targetPath) {
   return {
      name: "copy-asset",
      async generateBundle() {
         await fs.copyFile(sourcePath, targetPath, fs.constants.COPYFILE_FICLONE);
         this.info(`Copied asset "${sourcePath}" to "${targetPath}".`);
      },
      renderChunk(code, chunk, options) {
         let sourceFileName = path.basename(sourcePath);
         let targetFileName = path.basename(targetPath);
         return code.replaceAll(sourceFileName, targetFileName);
      }
   }
}

/**
 * Returns a JS file that recursively exports all modules from all JS files in a directory.
 * In each JS module file, the file paths for importing must be relative!
 */
export function getAllModules() {
   return {
      name: "get-all-modules",
      resolveId(source) {
         if (pathContainsAllModulesSuffix(source)) {
            return source;
         } else {
            return null;
         }
      },
      async load(id) {
         if (pathContainsAllModulesSuffix(id)) {
            let rootPath = getAbsolutePathWithoutAllModulesSuffix(id);
            let files = await findJsFilesAsync(rootPath);
            let exportsFile = "";
            for (let file of files) {
               let exportStatement = await generateExportsLineAsync(process.cwd(), file);
               if (exportStatement !== null) {
                  exportsFile += exportStatement + "\n";
               }
            }
            this.info(`Exporting modules from ${files.length} files found in "${id}".`);
            return exportsFile;
         }  
         else {
            return null;
         }
      }
   }
}

const pathContainsAllModulesSuffix = (filePath) => {
   let lastSuffixIndex = filePath.lastIndexOf(getAllModulesSuffixPosix);
   if (lastSuffixIndex !== (filePath.length - getAllModulesSuffixPosix.length)) {
      lastSuffixIndex = filePath.lastIndexOf(getAllModulesSuffixWindows);
      if (lastSuffixIndex !== (filePath.length - getAllModulesSuffixPosix.length)) {
         return false;
      }
   }
   return true;
};

const getAbsolutePathWithoutAllModulesSuffix = (filePath) => {
   let pathWithoutSuffix = filePath
      .replaceAll(getAllModulesSuffixPosix, "")
      .replaceAll(getAllModulesSuffixWindows, "");
   return path.join(process.cwd(), pathWithoutSuffix);
};

const findJsFilesAsync = async (directory) => {
   let entries = await fs.readdir(directory, { withFileTypes: true, recursive: true });
   let filePaths = [];
   for (let entry of entries) {
      let entryNameLowercase = entry.name.toLowerCase();
      if (entry.isFile() && path.extname(entryNameLowercase) === ".js" &&
         !entryNameLowercase.includes("demo.") && !entryNameLowercase.includes("test.") &&
         !entryNameLowercase.includes("exports.")) {
         filePaths.push(path.join(entry.parentPath, entry.name));
      }
   }
   return filePaths;
};

const getExportsFromFileAsync = async (filePath) => {
   let module = await import(filePath);
   return Object.keys(module);
};

const generateExportsLineAsync = async (rootPath, filePath) => {
   var moduleExports;
   try {
      moduleExports = await getExportsFromFileAsync(filePath);
   } catch (error) {
      console.warn(`The file ${filePath} couldn't be loaded: ${error} (assuming file name as module name).`);
      moduleExports = [ path.basename(filePath, ".js") ];
   }

   let moduleExportsFormatted = moduleExports.join(", ");
   return `export { ${moduleExportsFormatted} } from "${filePath}";`;
}