"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import {
  Upload,
  Download,
  RotateCcw,
  Check,
  Loader2,
  Sparkles,
  Eraser,
  Wand2,
  ZoomIn,
  Crop,
  User,
} from "lucide-react";
import { upload } from "@imagekit/next";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

import {
  transformationOptions,
  demoImages,
  buildTransformationUrl,
} from "@/config/imagekit";

// Icon mapping for transformations
const iconMap = {
  eraser: Eraser,
  scissors: Eraser,
  shadow: Wand2,
  sparkles: Sparkles,
  "zoom-in": ZoomIn,
  crop: Crop,
  user: User,
  copy: Sparkles,
  palette: Wand2,
  edit: Sparkles,
};

export default function Home() {
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [selectedTransformations, setSelectedTransformations] = useState<
    string[]
  >([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedImageUrl, setProcessedImageUrl] = useState<string>("");
  const [processingProgress, setProcessingProgress] = useState(0);
  const [currentDemoImage, setCurrentDemoImage] = useState<string>("");
  const [isUsingDemo, setIsUsingDemo] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string>("");

  // Add test function to window for debugging
  useEffect(() => {
    (window as any).testTransformation = (
      imageUrl: string,
      transformation: string
    ) => {
      console.log("🧪 Test de la transformation:", transformation);
      console.log("📸 URL originale:", imageUrl);

      const testUrl = buildTransformationUrl(imageUrl, [transformation]);
      console.log("🔗 URL transformée :", testUrl);

      // Test if the transformation URL loads
      const img = new Image();
      img.onload = () => {
        console.log(
          "✅ Transformation réussie ! Dimensions de l'image:",
          img.width,
          "x",
          img.height
        );
      };
      img.onerror = () => {
        console.error("❌ Échec du chargement de la transformation");
      };
      img.src = testUrl;

      return testUrl;
    };

    console.log(
      "🛠️ Outils de debug chargés ! Essayez : testTransformation('votre-url-image', 'e-bgremove')"
    );
  }, []);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setUploadedImage(file);
      setImagePreview(URL.createObjectURL(file));
      setProcessedImageUrl("");
      setSelectedTransformations([]);
      setCurrentDemoImage("");
      setIsUsingDemo(false);
      setUploadedImageUrl("");
      setUploadError("");

      // Upload to ImageKit using the official SDK
      setIsUploading(true);
      try {
        console.log("🚀 Début de l'upload vers ImageKit...");

        // Get authentication parameters
        const authResponse = await fetch("/api/upload-auth");
        if (!authResponse.ok) {
          const errorText = await authResponse.text();
          console.error("Erreur auth response:", errorText);
          throw new Error(
            `Échec de l'authentification de l'upload: ${authResponse.status}`
          );
        }

        const authData = await authResponse.json();
        console.log("✅ Paramètres d'authentification reçus:", {
          hasToken: !!authData.token,
          hasSignature: !!authData.signature,
          expire: authData.expire,
          expireDate: new Date(authData.expire * 1000).toISOString(),
          publicKey: authData.publicKey?.substring(0, 10) + "...",
        });

        // Vérifier la validité du timestamp expire
        const currentTime = Math.floor(Date.now() / 1000);
        const timeUntilExpire = authData.expire - currentTime;

        if (timeUntilExpire <= 0) {
          throw new Error("Token d'authentification expiré");
        }

        if (timeUntilExpire > 3600) {
          // Plus d'1 heure
          throw new Error(
            "Token d'authentification expire trop loin dans le futur"
          );
        }

        console.log(`⏰ Token expire dans ${timeUntilExpire} secondes`);

        // Upload using ImageKit SDK
        const uploadResponse = await upload({
          file,
          fileName: file.name,
          token: authData.token,
          expire: authData.expire,
          signature: authData.signature,
          publicKey: authData.publicKey,
          // Optional: Track upload progress
          onProgress: (event) => {
            const progress = Math.round((event.loaded / event.total) * 100);
            console.log(`📊 Progression upload: ${progress}%`);
          },
        });

        console.log("📤 Réponse upload ImageKit:", uploadResponse);

        if (uploadResponse.url) {
          setUploadedImageUrl(uploadResponse.url);
          console.log("✅ Image uploadée vers ImageKit:", uploadResponse.url);
          setUploadError("");
        } else {
          throw new Error("Upload response missing URL");
        }
      } catch (error) {
        console.error("❌ Erreur upload:", error);
        setUploadError(
          error instanceof Error ? error.message : "Erreur d'upload inconnue"
        );
        // Upload failed, but we can still continue with demo
      } finally {
        setIsUploading(false);
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"] },
    multiple: false,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const applyTransformations = async () => {
    if (!uploadedImage || selectedTransformations.length === 0) return;

    setIsProcessing(true);
    setProcessingProgress(0);
    setIsImageLoading(false); // Reset any previous loading state

    const progressInterval = setInterval(() => {
      setProcessingProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 15;
      });
    }, 400);

    try {
      const transformationParams = selectedTransformations
        .map((id) => {
          const option = transformationOptions.find((opt) => opt.id === id);
          return option?.transformation;
        })
        .filter((param): param is string => Boolean(param));

      let baseImageUrl = "";

      if (isUsingDemo) {
        // Use demo image
        baseImageUrl = currentDemoImage;
      } else if (uploadedImageUrl) {
        // Use uploaded image
        baseImageUrl = uploadedImageUrl;
      } else {
        // Fallback to demo if upload failed
        baseImageUrl = demoImages[0].url;
        console.log("Fallback: Using demo image since upload failed");
      }

      const transformedUrl = buildTransformationUrl(
        baseImageUrl,
        transformationParams
      );

      console.log(
        "Transformation applied to:",
        isUsingDemo
          ? "Demo image"
          : uploadedImageUrl
          ? "Your uploaded image"
          : "Demo fallback"
      );
      console.log("Transformed URL:", transformedUrl);

      // AI transformations can take 10-60 seconds to process
      // Show immediate result, but it might take time to load
      console.log(
        "⏱️ Note: AI transformations can take 10-60 seconds to process"
      );

      setProcessedImageUrl(transformedUrl);
      setIsImageLoading(true); // Start loading state for transformed image
      setProcessingProgress(100);
      setIsProcessing(false);
    } catch (error) {
      console.error("Error applying transformations:", error);
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  };

  const useDemoImage = () => {
    const randomDemo =
      demoImages[Math.floor(Math.random() * demoImages.length)];
    setCurrentDemoImage(randomDemo.url);
    setImagePreview(randomDemo.url);
    setUploadedImage(new File([""], "demo-image.jpg", { type: "image/jpeg" }));
    setProcessedImageUrl("");
    setSelectedTransformations([]);
    setIsUsingDemo(true);
    setUploadError("");
  };

  const toggleTransformation = (transformationId: string) => {
    setSelectedTransformations((prev) => {
      if (prev.includes(transformationId)) {
        return prev.filter((id) => id !== transformationId);
      } else {
        return [...prev, transformationId];
      }
    });

    // Reset processed image and loading state when changing selections
    if (processedImageUrl) {
      setProcessedImageUrl("");
      setIsImageLoading(false);
    }
  };

  const downloadImage = () => {
    if (processedImageUrl) {
      const link = document.createElement("a");
      link.href = processedImageUrl;
      link.download = "ai-transformed-image.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const reset = () => {
    setUploadedImage(null);
    setImagePreview("");
    setProcessedImageUrl("");
    setSelectedTransformations([]);
    setIsProcessing(false);
    setProcessingProgress(0);
    setCurrentDemoImage("");
    setIsUsingDemo(false);
    setUploadedImageUrl("");
    setIsUploading(false);
    setIsImageLoading(false);
    setUploadError("");
  };

  // Get main transformations (most popular ones)
  const mainTransformations = transformationOptions.filter((t) =>
    [
      "bg-removal",
      "bg-remove-shadow",
      "smart-crop",
      "face-crop",
      "resize-optimize",
      "enhance-basic",
    ].includes(t.id)
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-display font-bold mb-4">
            Studio d'Images IA
          </h1>
          <p className="text-muted-foreground font-sans">
            Transformez vos images avec l'IA
          </p>
        </div>

        {!uploadedImage ? (
          /* Upload State */
          <Card className="mx-auto">
            <CardContent className="p-8">
              <div
                {...getRootProps()}
                className={`p-12 text-center cursor-pointer border-2 border-dashed rounded-lg transition-colors ${
                  isDragActive
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-primary/50"
                }`}
              >
                <input {...getInputProps()} />

                <div className="space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                    <Upload className="w-8 h-8 text-primary" />
                  </div>

                  <div>
                    <h3 className="text-xl font-heading font-semibold mb-2">
                      {isDragActive
                        ? "Déposez votre image"
                        : "Téléchargez une image"}
                    </h3>
                    <p className="text-muted-foreground font-sans">
                      JPG, PNG, WEBP jusqu'à 10 Mo
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 w-full">
                    <Button
                      className="w-full sm:w-auto"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Choisir un fichier
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full sm:w-auto"
                      onClick={(e) => {
                        e.stopPropagation();
                        useDemoImage();
                      }}
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Essayer la démo
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : isProcessing ? (
          /* Processing State */
          <Card className="mx-auto">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
              <h3 className="text-xl font-heading font-semibold mb-4">
                Traitement en cours
              </h3>
              <div className="space-y-2 mb-4">
                <Progress value={processingProgress} className="h-2" />
                <p className="text-sm text-muted-foreground">
                  {processingProgress}%
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Main Interface */
          <div className="space-y-8">
            {/* Image and Controls */}
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Image Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading">Votre image</CardTitle>
                  {isUploading && (
                    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        📤 Téléversement vers ImageKit...
                      </p>
                    </div>
                  )}
                  {!isUsingDemo &&
                    uploadedImage &&
                    !isUploading &&
                    uploadedImageUrl && (
                      <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                        <p className="text-sm text-green-800 dark:text-green-200">
                          ✅ Image téléversée ! Les transformations IA
                          s'appliqueront à votre image.
                        </p>
                      </div>
                    )}
                  {!isUsingDemo &&
                    uploadedImage &&
                    !isUploading &&
                    !uploadedImageUrl &&
                    uploadError && (
                      <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                        <p className="text-sm text-red-800 dark:text-red-200">
                          ❌ Échec du téléversement: {uploadError}
                        </p>
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                          Les transformations utiliseront une image de démo.
                        </p>
                      </div>
                    )}
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/50 rounded-lg p-4 aspect-square flex items-center justify-center">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-w-full max-h-full object-contain rounded"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Transformations */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading">Outils IA</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {mainTransformations.map((option) => {
                    const Icon =
                      iconMap[option.icon as keyof typeof iconMap] || Sparkles;
                    const isSelected = selectedTransformations.includes(
                      option.id
                    );
                    return (
                      <div
                        key={option.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                        onClick={() => toggleTransformation(option.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Icon className="w-5 h-5 text-primary" />
                            <span className="font-heading font-medium">
                              {option.name}
                            </span>
                          </div>
                          {isSelected && (
                            <Check className="w-4 h-4 text-primary" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>

            {/* Action Button */}
            {selectedTransformations.length > 0 && (
              <div className="text-center">
                <Button
                  onClick={applyTransformations}
                  size="lg"
                  className="px-8"
                  disabled={isUploading}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {isUploading
                    ? "Téléversement..."
                    : "Appliquer les outils IA"}{" "}
                  ({selectedTransformations.length})
                </Button>
              </div>
            )}

            {/* Results */}
            {processedImageUrl && (
              <div className="space-y-6">
                <Card className="border-green-200 dark:border-green-800">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 mx-auto bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
                      <Check className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-lg font-heading font-semibold mb-2">
                      Transformation IA terminée !
                    </h3>
                    <p className="text-muted-foreground font-sans">
                      {isUsingDemo
                        ? "L'image de démonstration a été transformée"
                        : uploadedImageUrl
                        ? "Votre image téléversée a été transformée"
                        : "Transformation démontrée sur une image d'exemple"}
                    </p>
                  </CardContent>
                </Card>

                <div className="grid lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg font-heading">
                        Original
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-muted/50 rounded p-4 aspect-square flex items-center justify-center">
                        <img
                          src={imagePreview}
                          alt="Original"
                          className="max-w-full max-h-full object-contain rounded"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg font-heading flex items-center">
                        Transformé par IA
                        <Badge className="ml-auto">
                          <Sparkles className="w-3 h-3 mr-1" />
                          {isUsingDemo
                            ? "Demo"
                            : uploadedImageUrl
                            ? "Votre image"
                            : "Exemple"}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-transparent-pattern rounded p-4 aspect-square flex items-center justify-center relative">
                        {/* Loading spinner overlay */}
                        {isImageLoading && (
                          <div className="absolute inset-0 bg-background/80 rounded flex items-center justify-center z-10">
                            <div className="text-center space-y-3">
                              <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
                              <div className="text-sm text-muted-foreground">
                                <p className="font-medium">
                                  Traitement de la transformation…
                                </p>
                                <p className="text-xs">
                                  Cela peut prendre 10 à 60 secondes
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        <img
                          src={processedImageUrl}
                          alt="Transformed"
                          className="max-w-full max-h-full object-contain rounded"
                          onLoad={() => {
                            console.log(
                              "✅ Image transformée chargée avec succès"
                            );
                            setIsImageLoading(false);
                          }}
                          onError={(e) => {
                            console.error(
                              "❌ Échec du chargement de l'image transformée:",
                              processedImageUrl
                            );
                            console.error("Error event:", e);
                            setIsImageLoading(false); // Hide loading spinner
                            // Don't fallback automatically - let user see the error
                            e.currentTarget.style.border = "2px solid red";
                            e.currentTarget.style.background =
                              "rgba(255,0,0,0.1)";
                            e.currentTarget.alt =
                              "Échec du chargement de la transformation";
                          }}
                        />
                      </div>

                      {/* Debug info */}
                      <div
                        className={`mt-3 p-2 rounded text-center ${
                          isImageLoading
                            ? "bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800"
                            : "bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800"
                        }`}
                      >
                        {isImageLoading ? (
                          <p className="text-xs text-yellow-800 dark:text-yellow-200">
                            ⏳ ImageKit traite votre transformation…
                          </p>
                        ) : (
                          <p className="text-xs text-blue-800 dark:text-blue-200 font-mono break-all">
                            🔗 URL de transformation: {processedImageUrl}
                          </p>
                        )}
                      </div>

                      {!isUsingDemo && !uploadedImageUrl && uploadError && (
                        <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded text-center">
                          <p className="text-xs text-amber-700 dark:text-amber-300">
                            Résultat de la démo – échec du téléversement:{" "}
                            {uploadError}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center w-full">
                  <Button
                    onClick={downloadImage}
                    size="lg"
                    className="w-full sm:w-auto"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Télécharger
                  </Button>
                  <Button
                    onClick={reset}
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Nouvelle image
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx global>{`
        .bg-transparent-pattern {
          background-image: linear-gradient(
              45deg,
              hsl(var(--muted)) 25%,
              transparent 25%
            ),
            linear-gradient(-45deg, hsl(var(--muted)) 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, hsl(var(--muted)) 75%),
            linear-gradient(-45deg, transparent 75%, hsl(var(--muted)) 75%);
          background-size: 20px 20px;
          background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
        }
      `}</style>
    </div>
  );
}
