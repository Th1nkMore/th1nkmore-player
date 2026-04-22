import path from "node:path";

function toRelative(files) {
  return files.map((file) => path.relative(process.cwd(), file));
}

function quote(file) {
  return JSON.stringify(file);
}

function commandFor(files, command) {
  if (files.length === 0) {
    return [];
  }

  return [`${command} ${files.map(quote).join(" ")}`];
}

export default {
  "*": (files) => {
    const relativeFiles = toRelative(files);
    const biomeFiles = relativeFiles.filter((file) =>
      /\.(?:ts|tsx|js|jsx|json)$/.test(file),
    );
    const lengthCheckedFiles = relativeFiles.filter((file) =>
      /\.(?:ts|tsx)$/.test(file),
    );

    return [
      ...commandFor(biomeFiles, "pnpm exec biome check --write"),
      ...commandFor(lengthCheckedFiles, "node scripts/check-file-length.js"),
    ];
  },
};
