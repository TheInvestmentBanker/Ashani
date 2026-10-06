const fs = require("fs");
const path = require("path");

const COMFYUI_URL =
  process.env.COMFYUI_URL ||
  "http://127.0.0.1:8188";

const TEXT_WORKFLOW_PATH = path.join(
  __dirname,
  "../workflows/Text-to-Image_z_image_turbo.json"
);

const IMAGE_WORKFLOW_PATH = path.join(
  __dirname,
  "../workflows/Image-to-Image-image_z_image_turbo.json"
);


/*
|--------------------------------------------------------------------------
| Load workflow
|--------------------------------------------------------------------------
*/

function loadWorkflow(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(
      `ComfyUI workflow not found: ${filePath}`
    );
  }

  return JSON.parse(
    fs.readFileSync(
      filePath,
      "utf8"
    )
  );
}


/*
|--------------------------------------------------------------------------
| Upload image
|--------------------------------------------------------------------------
*/

async function uploadImage(
  imageBuffer,
  filename
) {
  const formData =
    new FormData();

  const blob = new Blob(
    [imageBuffer],
    {
      type:
        "application/octet-stream",
    }
  );

  formData.append(
    "image",
    blob,
    filename
  );

  formData.append(
    "overwrite",
    "true"
  );

  const response =
    await fetch(
      `${COMFYUI_URL}/upload/image`,
      {
        method: "POST",
        body: formData,
      }
    );

  if (!response.ok) {
    const text =
      await response.text();

    throw new Error(
      `ComfyUI image upload failed: ${response.status} ${text}`
    );
  }

  return await response.json();
}


/*
|--------------------------------------------------------------------------
| Queue workflow
|--------------------------------------------------------------------------
*/

async function queuePrompt(
  workflow
) {
  const response =
    await fetch(
      `${COMFYUI_URL}/prompt`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          prompt: workflow,
        }),
      }
    );

  if (!response.ok) {
    const text =
      await response.text();

    throw new Error(
      `ComfyUI prompt failed: ${response.status} ${text}`
    );
  }

  const data =
    await response.json();

  if (!data.prompt_id) {
    throw new Error(
      "ComfyUI did not return a prompt_id."
    );
  }

  return data.prompt_id;
}


/*
|--------------------------------------------------------------------------
| Wait for completion
|--------------------------------------------------------------------------
*/

async function waitForCompletion(
  promptId,
  timeout = 300000
) {
  const start =
    Date.now();

  while (
    Date.now() - start <
    timeout
  ) {
    const response =
      await fetch(
        `${COMFYUI_URL}/history/${promptId}`
      );

    if (!response.ok) {
      throw new Error(
        `ComfyUI history request failed: ${response.status}`
      );
    }

    const history =
      await response.json();

    const result =
      history[promptId];

    if (result) {
      if (
        result.status?.status_str ===
        "error"
      ) {
        throw new Error(
          "ComfyUI workflow failed."
        );
      }

      if (
        result.status?.completed ===
          true ||
        result.outputs
      ) {
        return result;
      }
    }

    await new Promise(
      (resolve) =>
        setTimeout(
          resolve,
          500
        )
    );
  }

  throw new Error(
    "ComfyUI image generation timed out."
  );
}


/*
|--------------------------------------------------------------------------
| Get generated image
|--------------------------------------------------------------------------
*/

async function getOutputImage(
  history
) {
  const outputs =
    history.outputs || {};

  for (
    const nodeId of Object.keys(
      outputs
    )
  ) {
    const nodeOutput =
      outputs[nodeId];

    if (
      !Array.isArray(
        nodeOutput.images
      )
    ) {
      continue;
    }

    if (
      nodeOutput.images.length ===
      0
    ) {
      continue;
    }

    const image =
      nodeOutput.images[0];

    const params =
      new URLSearchParams({
        filename:
          image.filename,

        subfolder:
          image.subfolder || "",

        type:
          image.type || "output",
      });

    const response =
      await fetch(
        `${COMFYUI_URL}/view?${params.toString()}`
      );

    if (!response.ok) {
      throw new Error(
        `Failed to retrieve generated image: ${response.status}`
      );
    }

    const arrayBuffer =
      await response.arrayBuffer();

    return {
      buffer:
        Buffer.from(
          arrayBuffer
        ),

      filename:
        image.filename,

      mimeType:
        "image/png",
    };
  }

  throw new Error(
    "ComfyUI completed but returned no image."
  );
}


/*
|--------------------------------------------------------------------------
| Text-to-Image
|--------------------------------------------------------------------------
*/

async function generateTextToImage(
  prompt,
  resolution = "SD"
) {
  if (
    typeof prompt !== "string" ||
    !prompt.trim()
  ) {
    throw new Error(
      "Image prompt is required."
    );
  }

  const workflow =
    loadWorkflow(
      TEXT_WORKFLOW_PATH
    );

  const resolutions = {
  HD: {
    width: 1280,
    height: 720,
  },

  SD: {
    width: 854,
    height: 480,
  },

  LD: {
    width: 640,
    height: 360,
  },
};

const selectedResolution =
  resolutions[resolution] ||
  resolutions.SD;

workflow["68"].inputs.text =
  prompt.trim();

workflow["69"].inputs.width =
  selectedResolution.width;

workflow["69"].inputs.height =
  selectedResolution.height;

workflow["9"].inputs.filename_prefix =
  `Ashani_T2I_${resolution}`;

  const promptId =
    await queuePrompt(
      workflow
    );

  console.log(
    "COMFYUI T2I PROMPT:",
    promptId
  );

  const history =
    await waitForCompletion(
      promptId
    );

  return await getOutputImage(
    history
  );
}


/*
|--------------------------------------------------------------------------
| Image-to-Image
|--------------------------------------------------------------------------
*/

async function generateImageToImage(
  prompt,
  imageBuffer,
  filename
) {
  if (
    typeof prompt !== "string" ||
    !prompt.trim()
  ) {
    throw new Error(
      "Image prompt is required."
    );
  }

  if (
    !Buffer.isBuffer(
      imageBuffer
    )
  ) {
    throw new Error(
      "Input image buffer is required."
    );
  }

  const uploaded =
    await uploadImage(
      imageBuffer,
      filename
    );

  const uploadedFilename =
    uploaded.name ||
    filename;

  const workflow =
    loadWorkflow(
      IMAGE_WORKFLOW_PATH
    );

  workflow["68"].inputs.text =
    prompt.trim();

  workflow["74"].inputs.image =
    uploadedFilename;

  workflow["9"].inputs.filename_prefix =
    "Ashani_I2I";

  const promptId =
    await queuePrompt(
      workflow
    );

  console.log(
    "COMFYUI I2I PROMPT:",
    promptId
  );

  const history =
    await waitForCompletion(
      promptId
    );

  return await getOutputImage(
    history
  );
}


/*
|--------------------------------------------------------------------------
| Exports
|--------------------------------------------------------------------------
*/

module.exports = {
  generateTextToImage,
  generateImageToImage,
};