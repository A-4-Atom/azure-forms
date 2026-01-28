import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";
import { BlobServiceClient } from "@azure/storage-blob";
import { parse } from "csv-parse/sync";

interface ProcessCsvRequest {
  blobName: string;
  className: string;
  subjectName: string;
  teacherName: string;
}

interface StudentRecord {
  rollNo: string;
  name: string;
  obtainedMarks: string;
  totalMarks: string;
}

export async function processUploadedMarksHttp(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  try {
    // ---------- 1. Parse & validate request ----------
    const body = (await request.json()) as ProcessCsvRequest;

    const { blobName, className, subjectName, teacherName } = body;

    if (!blobName || !className || !subjectName || !teacherName) {
      return {
        status: 400,
        jsonBody: {
          message:
            "blobName, className, subjectName, and teacherName are required",
        },
      };
    }

    // ---------- 2. Cosmos DB setup ----------
    const cosmosClient = new CosmosClient({
      endpoint: process.env.COSMOS_ENDPOINT!,
      key: process.env.COSMOS_KEY!,
    });

    const database = cosmosClient.database(
      process.env.COSMOS_DATABASE!,
    );

    const marksContainer = database.container(
      process.env.COSMOS_CONTAINER!, // studentMarks
    );

    const statusContainer = database.container(
      "csvProcessingStatus",
    );

    // ---------- 3. Idempotency / duplicate check ----------
    const statusId = blobName;

    try {
      const { resource: existingStatus } =
        await statusContainer.item(statusId, blobName).read();

      if (existingStatus?.status === "processed") {
        return {
          status: 409,
          jsonBody: {
            message: "This file has already been processed",
          },
        };
      }

      if (existingStatus?.status === "processing") {
        return {
          status: 202,
          jsonBody: {
            message: "Processing already in progress",
          },
        };
      }
    } catch {
      // Item does not exist → OK to proceed
    }

    // ---------- 4. Mark status = processing ----------
    await statusContainer.items.create({
      id: statusId,
      blobName,
      status: "processing",
      className,
      subjectName,
      teacherName,
      startedAt: new Date().toISOString(),
    });

    // ---------- 5. Read blob from Blob Storage ----------
    const blobServiceClient = BlobServiceClient.fromConnectionString(
      process.env.AzureWebJobsStorage!,
    );

    const containerName =
      process.env.BLOB_CONTAINER_NAME || "uploads";

    const containerClient =
      blobServiceClient.getContainerClient(containerName);

    const blobClient =
      containerClient.getBlockBlobClient(blobName);

    const downloadResponse = await blobClient.download();
    const csvBuffer = await streamToBuffer(
      downloadResponse.readableStreamBody!,
    );

    const csvText = csvBuffer.toString("utf-8");

    // ---------- 6. Parse CSV ----------
    const records = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as StudentRecord[];

    if (records.length === 0) {
      throw new Error("CSV file is empty");
    }

    // ---------- 7. Insert student marks ----------
    const uploadedAt = new Date().toISOString();

    for (const row of records) {
      const obtainedMarks = Number(row.obtainedMarks);
      const totalMarks = Number(row.totalMarks);

      const percentage =
        totalMarks > 0
          ? (obtainedMarks / totalMarks) * 100
          : 0;

      const document = {
        id: `${className}_${subjectName}_${row.rollNo}`,
        className,
        subjectName,
        teacherName,
        rollNo: row.rollNo,
        name: row.name,
        obtainedMarks,
        totalMarks,
        percentage,
        uploadedAt,
      };

      await marksContainer.items.upsert(document);
    }

    // ---------- 8. Mark status = processed ----------
    await statusContainer
      .item(statusId, blobName)
      .replace({
        id: statusId,
        blobName,
        status: "processed",
        className,
        subjectName,
        teacherName,
        processedAt: new Date().toISOString(),
      });

    return {
      status: 202,
      jsonBody: {
        message: "File accepted and processing completed",
      },
    };
  } catch (err: any) {
    context.error("processUploadedMarksHttp error:", err);

    // Try to mark status as failed
    try {
      const body = (await request.json()) as ProcessCsvRequest;
      if (body?.blobName) {
        const cosmosClient = new CosmosClient({
          endpoint: process.env.COSMOS_ENDPOINT!,
          key: process.env.COSMOS_KEY!,
        });

        await cosmosClient
          .database(process.env.COSMOS_DATABASE!)
          .container("csvProcessingStatus")
          .item(body.blobName, body.blobName)
          .replace({
            id: body.blobName,
            blobName: body.blobName,
            status: "failed",
            error: err.message,
            failedAt: new Date().toISOString(),
          });
      }
    } catch {}

    return {
      status: 500,
      jsonBody: {
        message: "Failed to process CSV file",
        error: err.message,
      },
    };
  }
}

// ---------- Helper ----------
async function streamToBuffer(
  readableStream: NodeJS.ReadableStream,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    readableStream.on("data", (data) =>
      chunks.push(Buffer.isBuffer(data) ? data : Buffer.from(data)),
    );
    readableStream.on("end", () => resolve(Buffer.concat(chunks)));
    readableStream.on("error", reject);
  });
}

app.http("processUploadedMarksHttp", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: processUploadedMarksHttp,
});