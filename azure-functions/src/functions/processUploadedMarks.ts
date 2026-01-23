import { app, InvocationContext } from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";
import { parse } from "csv-parse/sync";

interface StudentRecord {
  rollNo: string;
  name: string;
  obtainedMarks: string;
  totalMarks: string;
}

export async function processUploadedMarks(
  blob: Buffer,
  context: InvocationContext
): Promise<void> {

  const blobName = context.triggerMetadata.name;
  context.log(`Processing uploaded file: ${blobName}`);

  const metadata = (context.triggerMetadata.metadata || {}) as Record<string, unknown>;

  const className = metadata.classname as string | undefined;
  const subjectName = metadata.subjectname as string | undefined;
  const teacherName = metadata.teachername as string | undefined;

  if (!className || !subjectName || !teacherName) {
    context.log("Missing metadata. Skipping file processing.");
    return;
  }

  context.log("Metadata received:", { className, subjectName, teacherName });

  const csvText = blob.toString("utf-8");

  const records = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  context.log(`Parsed ${records.length} student records`);

  const client = new CosmosClient({
    endpoint: process.env.COSMOS_ENDPOINT!,
    key: process.env.COSMOS_KEY!,
  });

  const container = client
    .database(process.env.COSMOS_DATABASE!)
    .container(process.env.COSMOS_CONTAINER!);

  const uploadedAt = new Date().toISOString();

  for (const row of records) {
    const typedRow = row as StudentRecord;
    const rollNo = typedRow.rollNo;
    const name = typedRow.name;
    const obtainedMarks = Number(typedRow.obtainedMarks);
    const totalMarks = Number(typedRow.totalMarks);

    const percentage =
      totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0;

    const document = {
      id: `${className}_${subjectName}_${rollNo}`,

      className,
      subjectName,
      teacherName,

      rollNo,
      name,
      obtainedMarks,
      totalMarks,
      percentage,

      uploadedAt,
    };

    await container.items.create(document);
  }

  context.log("All student records successfully inserted into Cosmos DB");
}


app.storageBlob("storageBlobTrigger1", {
  path: "uploads/{name}",
  connection: "AzureWebJobsStorage",
  source: "EventGrid",
  handler: processUploadedMarks,
});
