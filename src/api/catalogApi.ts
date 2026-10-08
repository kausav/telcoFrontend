import { api } from './client';
import type {
  CatalogImportRequest,
  CatalogImportResponse,
  CatalogCountry,
  CatalogItem,
  CatalogJourney,
  CatalogScenarioDetail,
  CatalogScenarioList,
  CatalogTree,
} from './types';

/** Countries the generator can localise data for (sent as `country` on /scenario/propose). */
export const getCountries = async (): Promise<CatalogCountry[]> => (await api.get<CatalogCountry[]>('/catalog/countries')).data;

/** The catalog behind the dropdowns: industry -> sub-domain -> use case -> journey -> scenario. */
export const getIndustries = async (): Promise<CatalogItem[]> => (await api.get<CatalogItem[]>('/catalog/industries')).data;

export const getSubDomains = async (industryId: string): Promise<CatalogItem[]> =>
  (await api.get<CatalogItem[]>('/catalog/sub-domains', { params: { industryId } })).data;

export const getUseCases = async (subDomainId: string): Promise<CatalogItem[]> =>
  (await api.get<CatalogItem[]>('/catalog/use-cases', { params: { subDomainId } })).data;

export const getJourneys = async (useCaseId: string): Promise<CatalogJourney[]> =>
  (await api.get<CatalogJourney[]>('/catalog/journeys', { params: { useCaseId } })).data;

export const getScenarios = async (journeyId: string): Promise<CatalogScenarioList> =>
  (await api.get<CatalogScenarioList>('/catalog/scenarios', { params: { journeyId } })).data;

/** One scenario with its path through the catalog and the /scenario/propose fields the catalog knows. */
export const getScenarioDetail = async (scenarioId: string): Promise<CatalogScenarioDetail> =>
  (await api.get<CatalogScenarioDetail>(`/catalog/scenarios/${encodeURIComponent(scenarioId)}`)).data;

/** The whole active catalog in one call (not used by the cascading dropdowns). */
export const getCatalogTree = async (): Promise<CatalogTree> => (await api.get<CatalogTree>('/catalog/tree')).data;

/** Add catalog entries or update existing ones; switch an entry off with `active: false`. */
export const importCatalog = async (body: CatalogImportRequest): Promise<CatalogImportResponse> =>
  (await api.post<CatalogImportResponse>('/catalog/import', body)).data;
