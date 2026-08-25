import { put, del } from "@vercel/blob";
import {
  assertBlobCredentials,
  BLOB_OIDC_DEVELOPMENT_ERROR,
  BlobStorageError,
  getBlobAuthMode,
  getBlobReadWriteToken,
  getSafeBlobProviderErrorMessage,
  hasBlobCredentials,
  isBlobOidcEnvironmentError,
} from "@/lib/storage/blob-config";

export type UploadedBlob = {
  url: string;
  storageKey: string;
};

type PutOptions = Parameters<typeof put>[2];

async function putWithAuth(
  pathname: string,
  file: File | Blob,
  staticToken: string | null,
  forceStaticToken = false
): Promise<Awaited<ReturnType<typeof put>>> {
  const options: PutOptions = {
    access: "public",
    addRandomSuffix: false,
  };

  if (staticToken && (forceStaticToken || getBlobAuthMode() === "readWriteToken")) {
    options.token = staticToken;
  }

  return put(pathname, file, options);
}

function uploadErrorFromProvider(error: unknown, staticToken: string | null): never {
  console.error(
    "Blob upload failed: provider error",
    getSafeBlobProviderErrorMessage(error)
  );

  if (isBlobOidcEnvironmentError(error)) {
    throw new BlobStorageError(
      staticToken ? "העלאת התמונה נכשלה. נסה שוב." : BLOB_OIDC_DEVELOPMENT_ERROR
    );
  }

  throw new BlobStorageError("העלאת התמונה נכשלה. נסה שוב.");
}

export async function uploadPublicBlob(
  pathname: string,
  file: File | Blob
): Promise<UploadedBlob> {
  assertBlobCredentials();

  const staticToken = getBlobReadWriteToken();

  try {
    const result = await putWithAuth(pathname, file, staticToken);

    return {
      url: result.url,
      storageKey: result.pathname,
    };
  } catch (error) {
    if (isBlobOidcEnvironmentError(error) && staticToken) {
      try {
        const result = await putWithAuth(pathname, file, staticToken, true);

        return {
          url: result.url,
          storageKey: result.pathname,
        };
      } catch (retryError) {
        uploadErrorFromProvider(retryError, staticToken);
      }
    }

    uploadErrorFromProvider(error, staticToken);
  }
}

export async function deleteBlobByStorageKey(storageKey: string): Promise<void> {
  if (!hasBlobCredentials()) {
    console.error("Blob delete skipped: credentials unavailable.");
    return;
  }

  const staticToken = getBlobReadWriteToken();
  const options = staticToken && getBlobAuthMode() === "readWriteToken"
    ? { token: staticToken }
    : {};

  try {
    await del(storageKey, options);
  } catch {
    console.error("Blob delete failed for managed storage key.");
  }
}
