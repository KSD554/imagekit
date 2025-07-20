export const imagekitConfig = {
  urlEndpoint: "https://ik.imagekit.io/v1wrbty4i",
  publicKey: "public_0z5T4Qo0mxX3Ws801F0IneiEpC4=",
  // Note: Private key should be used server-side only
};

export const transformations = {
  backgroundRemoval: {
    standard: "e-removedotbg", // 130 units
    efficient: "e-bgremove", // 10 units
  },
  enhance: {
    retouch: "e-retouch", // 5 units
    upscale: "e-upscale", // 5 units
  },
  effects: {
    dropShadow: "e-dropshadow", // 1 unit
    generateVar: "e-genvar", // 25 units
  },
  smart: {
    faceCrop: "fo-face", // Free
    smartCrop: "fo-auto", // Free
  },
};

export const transformationOptions = [
  {
    id: "bg-removal",
    name: "Suppression d'arrière-plan",
    description: "Supprime instantanément l'arrière-plan avec l'IA",
    icon: "eraser",
    transformation: "e-bgremove",
    cost: 10,
    category: "background",
  },
  {
    id: "bg-removal-premium",
    name: "Suppression d'arrière-plan Premium",
    description: "Suppression d'arrière-plan de meilleure qualité",
    icon: "scissors",
    transformation: "e-removedotbg",
    cost: 130,
    category: "background",
  },
  {
    id: "bg-remove-shadow",
    name: "Suppression d'arrière-plan + Ombre portée",
    description: "Supprime l'arrière-plan et ajoute une ombre réaliste",
    icon: "shadow",
    transformation: "e-bgremove:e-dropshadow",
    cost: 11,
    category: "effects",
  },
  {
    id: "smart-crop",
    name: "Recadrage intelligent carré",
    description: "Recadrage automatique en carré 400x400",
    icon: "crop",
    transformation: "w-400,h-400,fo-auto",
    cost: 0,
    category: "smart",
  },
  {
    id: "face-crop",
    name: "Recadrage visage carré",
    description: "Recadrer sur le visage en 300x300",
    icon: "user",
    transformation: "w-300,h-300,fo-face",
    cost: 0,
    category: "smart",
  },
  {
    id: "resize-optimize",
    name: "Optimiser et redimensionner",
    description: "Redimensionner à 800px de largeur avec optimisation de la qualité",
    icon: "zoom-in",
    transformation: "w-800,q-80,f-auto",
    cost: 0,
    category: "optimize",
  },
  {
    id: "enhance-basic",
    name: "Améliorer la qualité",
    description: "Amélioration basique de l'image",
    icon: "sparkles",
    transformation: "e-sharpen,e-contrast",
    cost: 0,
    category: "enhance",
  },
];


// Working demo images for testing transformations
export const demoImages = [
  {
    url: "https://ik.imagekit.io/demo/img/image4.jpeg",
    name: "Person with background",
  },
  {
    url: "https://ik.imagekit.io/demo/img/image1.jpeg",
    name: "Portrait",
  },
  {
    url: "https://ik.imagekit.io/demo/medium_cafe_B1iTdD0C.jpg",
    name: "Cafe scene",
  },
  {
    url: "https://ik.imagekit.io/demo/img/image10.jpeg",
    name: "Group photo",
  },
  {
    url: "https://ik.imagekit.io/demo/img/image2.jpeg",
    name: "Outdoor scene",
  },
];

// Helper function to build transformation URL
export const buildTransformationUrl = (
  imageUrl: string,
  transformations: string[]
) => {
  if (!imageUrl || transformations.length === 0) return imageUrl;

  console.log("Building transformation for URL:", imageUrl);
  console.log("Transformations to apply:", transformations);

  // Build transformation string
  const transformationStr = transformations.join(",");

  // Check if it's a demo image or user-uploaded image
  if (imageUrl.includes("/demo/")) {
    // Handle demo images
    const urlParts = imageUrl.split("/");
    const demoIndex = urlParts.findIndex((part) => part === "demo");

    if (demoIndex === -1) {
      console.error("Invalid demo image URL:", imageUrl);
      return imageUrl;
    }

    // Get the path after /demo/
    const imagePath = urlParts.slice(demoIndex + 1).join("/");

    // Construct the transformed URL for demo images
    const transformedUrl = `https://ik.imagekit.io/demo/tr:${transformationStr}/${imagePath}`;

    console.log("Demo transformed URL:", transformedUrl);
    return transformedUrl;
  } else {
    // Handle user-uploaded images from your ImageKit account
    try {
      const url = new URL(imageUrl);
      const pathname = url.pathname;

      // Extract the file path (remove leading slash and account ID)
      let filePath = pathname.startsWith("/") ? pathname.slice(1) : pathname;

      // Remove the account ID from the beginning of the path if it exists
      // URLs are like: https://ik.imagekit.io/yk7yipdov/filename.jpg
      // So pathname is: /yk7yipdov/filename.jpg
      // We need to remove 'yk7yipdov/' to get just 'filename.jpg'
      const accountId = "v1wrbty4i";
      if (filePath.startsWith(accountId + "/")) {
        filePath = filePath.substring(accountId.length + 1);
      }

      // For chained transformations, use colon separator as per ImageKit docs
      const chainedTransformations = transformations.join(":");

      // Build the transformed URL for user images
      const transformedUrl = `${imagekitConfig.urlEndpoint}/tr:${chainedTransformations}/${filePath}`;

      console.log("User image transformed URL:", transformedUrl);
      return transformedUrl;
    } catch (error) {
      console.error("Error parsing image URL:", error);
      return imageUrl;
    }
  }
};