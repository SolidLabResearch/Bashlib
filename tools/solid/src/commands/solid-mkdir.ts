import { createContainerAt } from '@inrupt/solid-client';
type MakeDirOptions = {
  fetch: any,
  verbose?: boolean,
}
export default async function makeDirectory(url: string, options: MakeDirOptions) {
  let info = await createContainerAt(url, { fetch: options.fetch });
  if (options.verbose) console.log(`Container successfully created at ${url}`);
  return info
}
