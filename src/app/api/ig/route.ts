import { POST as instagramPost } from "../instagram/route";

export async function POST(request: Request) {
  return instagramPost(request);
}
