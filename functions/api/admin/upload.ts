import { AdminInputError, uploadImage, type AdminEnv } from "../../../server/admin";
import { noStoreJson } from "../../../server/http";

// POST /api/admin/upload (multipart, field "file"): stores an image in R2, returns its key.
export const onRequestPost: PagesFunction<AdminEnv> = async ({ env, request }) => {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    throw new AdminInputError("Send the image as a file upload");
  }
  return noStoreJson(await uploadImage(env, form.get("file")), 201);
};
