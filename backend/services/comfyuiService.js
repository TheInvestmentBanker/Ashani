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

/*
|--------------------------------------------------------------------------
| Image-to-Image
|--------------------------------------------------------------------------
*/

async function generateImageToImage(
  prompt,
  imageBuffer,
  filename,
  profile = {}
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

  /*
  |--------------------------------------------------------------------------
  | Upload source image to ComfyUI
  |--------------------------------------------------------------------------
  */

  const uploaded =
    await uploadImage(
      imageBuffer,
      filename
    );

  const uploadedFilename =
    uploaded.name ||
    filename;

  /*
  |--------------------------------------------------------------------------
  | Load Img2Img workflow
  |--------------------------------------------------------------------------
  */

  const workflow =
    loadWorkflow(
      IMAGE_WORKFLOW_PATH
    );

  /*
  |--------------------------------------------------------------------------
  | Validate required nodes
  |--------------------------------------------------------------------------
  */

  const requiredNodes = [
    "68", // CLIP Text Encode
    "74", // Load Image
    "75", // VAE Encode
    "71", // KSampler
    "67", // VAE Decode
    "9",  // Save Image
  ];

  for (
    const nodeId of requiredNodes
  ) {
    if (
      !workflow[nodeId] ||
      !workflow[nodeId].inputs
    ) {
      throw new Error(
        `Img2Img workflow is missing node ${nodeId} or its inputs.`
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Prompt
  |--------------------------------------------------------------------------
  */

  workflow["68"].inputs.text =
    prompt.trim();

  /*
  |--------------------------------------------------------------------------
  | Uploaded image
  |--------------------------------------------------------------------------
  */

  workflow["74"].inputs.image =
    uploadedFilename;

  /*
  |--------------------------------------------------------------------------
  | Generation profile
  |--------------------------------------------------------------------------
  |
  | Defaults are deliberately conservative for
  | the RTX 3060 6GB + Z-Image Turbo setup.
  |
  */

  const steps =
    Number.isFinite(
      profile.steps
    )
      ? profile.steps
      : 15;

  const denoise =
    Number.isFinite(
      profile.denoise
    )
      ? profile.denoise
      : 0.45;

  const cfg =
    Number.isFinite(
      profile.cfg
    )
      ? profile.cfg
      : 1.0;

  /*
  |--------------------------------------------------------------------------
  | KSampler
  |--------------------------------------------------------------------------
  */

  workflow["71"].inputs.steps =
    steps;

  workflow["71"].inputs.denoise =
    denoise;

  workflow["71"].inputs.cfg =
    cfg;

  /*
  |--------------------------------------------------------------------------
  | Seed
  |--------------------------------------------------------------------------
  */

  workflow["71"].inputs.seed =
    Math.floor(
      Math.random() *
        4294967296
    );

  /*
  |--------------------------------------------------------------------------
  | Output filename
  |--------------------------------------------------------------------------
  */

  workflow["9"].inputs.filename_prefix =
    "Ashani_I2I";

  /*
  |--------------------------------------------------------------------------
  | Queue
  |--------------------------------------------------------------------------
  */

  const promptId =
    await queuePrompt(
      workflow
    );

  console.log(
    "COMFYUI I2I PROMPT:",
    promptId
  );

  console.log(
    "COMFYUI I2I PROFILE:",
    {
      steps,
      denoise,
      cfg,
    }
  );

  /*
  |--------------------------------------------------------------------------
  | Wait
  |--------------------------------------------------------------------------
  */

  const history =
    await waitForCompletion(
      promptId
    );

  /*
  |--------------------------------------------------------------------------
  | Retrieve result
  |--------------------------------------------------------------------------
  */

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