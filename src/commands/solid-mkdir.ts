import { createContainerAt } from '@inrupt/solid-client';
import type { Logger } from '../logger';

type MakeDirOptions = {
  fetch: any,
  verbose?: boolean,
  logger?: Logger,
}
export default async function makeDirectory(url: string, options: MakeDirOptions) {
  let info = await createContainerAt(url, { fetch: options.fetch });
  if (options.verbose) (options.logger || console).log(`Container successfully created at ${url}`);
  return info
}
