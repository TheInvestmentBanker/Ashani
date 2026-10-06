const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const STORAGE_ROOT = path.join(
  __dirname,
  "..",
  "storage",
  "generated-images"
);

function ensureStorageDirectory() {
  fs.mkdirSync(
    STORAGE_ROOT,
    {
      recursive: true,
    }
  );
}

function getExtension(
  mimeType
) {
  switch (mimeType) {
    case "image/jpeg":
      return "jpg";

    case "image/webp":
      return "webp";

    case "image/png":
    default:
      return "png";
  }
}

function saveGeneratedImage(
  buffer,
  mimeType = "image/png"
) {
  if (
    !Buffer.isBuffer(buffer)
  ) {
    throw new Error(
      "Image buffer is required."
    );
  }

  ensureStorageDirectory();

  const extension =
    getExtension(mimeType);

  const filename =
    `ashani-${crypto.randomUUID()}.${extension}`;

  const absolutePath =
    path.join(
      STORAGE_ROOT,
      filename
    );

  fs.writeFileSync(
    absolutePath,
    buffer
  );

  return {
    filename,
    relativePath: path.join(
      "generated-images",
      filename
    ),
    absolutePath,
    mimeType,
  };
}

function readGeneratedImage(
  relativePath
) {
  if (
    !relativePath ||
    typeof relativePath !==
      "string"
  ) {
    return null;
  }

  const absolutePath =
    path.resolve(
      __dirname,
      "..",
      "storage",
      relativePath
    );

  const storageRoot =
    path.resolve(
      STORAGE_ROOT
    );

  if (
    !absolutePath.startsWith(
      storageRoot
    )
  ) {
    throw new Error(
      "Invalid image path."
    );
  }

  if (
    !fs.existsSync(
      absolutePath
    )
  ) {
    return null;
  }

  return fs.readFileSync(
    absolutePath
  );
}

function imageToDataUrl(
  buffer,
  mimeType
) {
  if (!buffer) {
    return null;
  }

  return `data:${mimeType};base64,${buffer.toString(
    "base64"
  )}`;
}

module.exports = {
  saveGeneratedImage,
  readGeneratedImage,
  imageToDataUrl,
};