import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import {
  BlobSASPermissions,
  BlobServiceClient,
  generateBlobSASQueryParameters,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";

interface UploadUrlRequest {
  className: string;
  subjectName: string;
  teacherName: string;
  fileName: string;
}

function extractCredentials(connectionString: string) {
  // Case 1: Azurite shortcut
  if (connectionString === "UseDevelopmentStorage=true") {
    return {
      accountName: "devstoreaccount1",
      accountKey:
        "Eby8vdM02xNoGz2G7kz0sQ3JvU1v4D6tWnX0v8Yp0d5p3zM1f8M8Z0Uu5Jw==",
    };
  }

  // Case 2: Real Azure connection string
  const parts = connectionString.split(";");
  const map: Record<string, string> = {};

  for (const part of parts) {
    const [key, value] = part.split("=");
    if (key && value) {
      map[key] = value;
    }
  }

  return {
    accountName: map["AccountName"],
    accountKey: map["AccountKey"],
  };
}

export async function GetUploadUrl(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  try {
    const body = await request.json();

    const { className, subjectName, teacherName, fileName } =
      body as UploadUrlRequest;

    // ---- Validation ----
    if (
      typeof className !== "string" ||
      typeof subjectName !== "string" ||
      typeof teacherName !== "string" ||
      typeof fileName !== "string"
    ) {
      return {
        status: 400,
        jsonBody: {
          message: "Invalid request body. All fields must be strings.",
        },
      };
    }

    if (!className || !subjectName || !teacherName || !fileName) {
      return {
        status: 400,
        jsonBody: {
          message:
            "className, subjectName, teacherName, and fileName are required",
        },
      };
    }

    // ---- Sanitize Inputs ----
    const sanitize = (str: string) => str.replace(/[^a-zA-Z0-9._-]/g, "_");
    const safeClassName = sanitize(className);
    const safeSubjectName = sanitize(subjectName);
    const safeTeacherName = sanitize(teacherName);
    const safeFileName = sanitize(fileName);
    const timestamp = Date.now();

    const blobName = `${safeClassName}_${safeSubjectName}_${safeTeacherName}_${timestamp}_${safeFileName}`;

    // ---- Storage Setup ----
    const containerName = process.env.BLOB_CONTAINER_NAME || "uploads";
    const connectionString = process.env.AzureWebJobsStorage;

    if (!connectionString) {
      context.error("Missing AzureWebJobsStorage connection string");
      return {
        status: 500,
        jsonBody: {
          message: "Internal server error: Storage configuration missing",
        },
      };
    }

    const blobServiceClient =
      BlobServiceClient.fromConnectionString(connectionString);

    const containerClient = blobServiceClient.getContainerClient(containerName);
    await containerClient.createIfNotExists();

    const blobClient = containerClient.getBlockBlobClient(blobName);

    // ---- Extract credentials (Azurite or Azure) ----
    const { accountName, accountKey } = extractCredentials(connectionString);

    if (!accountName || !accountKey) {
      context.error("Failed to parse storage account credentials");
      return {
        status: 500,
        jsonBody: {
          message: "Internal server error: Invalid storage credentials",
        },
      };
    }

    const credential = new StorageSharedKeyCredential(accountName, accountKey);

    // ---- Generate SAS ----
    const expiresOn = new Date();
    expiresOn.setMinutes(expiresOn.getMinutes() + 10);

    const sasToken = generateBlobSASQueryParameters(
      {
        containerName,
        blobName,
        permissions: BlobSASPermissions.parse("cw"),
        expiresOn,
      },
      credential,
    ).toString();

    let uploadUrl = `${blobClient.url}?${sasToken}`;

    // ---- Rewrite localhost URL to LAN IP for mobile access ----
    const lanIp = process.env.LAN_IP;

    if (lanIp) {
      uploadUrl = uploadUrl
        .replace("127.0.0.1", lanIp)
        .replace("localhost", lanIp);
    }

    return {
      status: 200,
      jsonBody: {
        uploadUrl,
        blobName,
      },
    };
  } catch (err: any) {
    context.error("GetUploadUrl error:", err);

    return {
      status: 500,
      jsonBody: { message: "Internal server error" },
    };
  }
}

app.http("GetUploadUrl", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: GetUploadUrl,
});
