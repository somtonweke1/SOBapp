'use server';

import { getDataSourceStatus as getDataSourceStatusCore, type DataSourceStatus } from '@/lib/api/data-source-status';

export async function getDataSourceStatus(): Promise<DataSourceStatus> {
  return getDataSourceStatusCore();
}
