import { useCallback, useRef, useState } from 'react';
import { getIndustries, getJourneys, getScenarios, getSubDomains, getUseCases } from '../api/catalogApi';
import type { CatalogItem, CatalogJourney, CatalogScenario } from '../api/types';
import { notifyApiError } from '../lib/notify';

export type LoadState = 'idle' | 'loading' | 'ready' | 'error';

export interface JourneyWithScenarios extends CatalogJourney {
  scenarios: CatalogScenario[];
}

/**
 * The cascading dropdowns of Step 1, each level loaded from the catalog API when its parent is chosen:
 * industry -> sub-domain -> use case -> journeys (each with its scenarios).
 * A slow answer for a choice the user has since changed is dropped, so a level never shows a stale parent's rows.
 */
export function useCatalog() {
  const [industries, setIndustries] = useState<CatalogItem[]>([]);
  const [industriesState, setIndustriesState] = useState<LoadState>('idle');
  const [subDomains, setSubDomains] = useState<CatalogItem[]>([]);
  const [subDomainsState, setSubDomainsState] = useState<LoadState>('idle');
  const [useCases, setUseCases] = useState<CatalogItem[]>([]);
  const [useCasesState, setUseCasesState] = useState<LoadState>('idle');
  const [journeys, setJourneys] = useState<JourneyWithScenarios[]>([]);
  const [journeysState, setJourneysState] = useState<LoadState>('idle');

  const [industryId, setIndustryId] = useState<string | null>(null);
  const [subDomainId, setSubDomainId] = useState('');
  const [useCaseId, setUseCaseId] = useState('');

  // One counter per level: a response only counts while its counter still has the value it was started with.
  const turn = useRef({ industries: 0, subDomains: 0, useCases: 0, journeys: 0 });
  const bump = (level: keyof typeof turn.current) => ++turn.current[level];

  const clearBelow = (level: 'industry' | 'subDomain' | 'useCase') => {
    if (level === 'industry') {
      bump('subDomains');
      setSubDomains([]);
      setSubDomainsState('idle');
      setSubDomainId('');
    }
    if (level === 'industry' || level === 'subDomain') {
      bump('useCases');
      setUseCases([]);
      setUseCasesState('idle');
      setUseCaseId('');
    }
    bump('journeys');
    setJourneys([]);
    setJourneysState('idle');
  };

  const loadIndustries = useCallback(async () => {
    const mine = bump('industries');
    setIndustriesState('loading');
    try {
      const items = await getIndustries();
      if (mine !== turn.current.industries) return;
      setIndustries(items);
      setIndustriesState('ready');
    } catch (error) {
      if (mine !== turn.current.industries) return;
      setIndustriesState('error');
      notifyApiError(error, 'Could not load the industry domains.');
    }
  }, []);

  const chooseIndustry = useCallback(async (id: string | null) => {
    setIndustryId(id);
    clearBelow('industry');
    if (!id) return;
    const mine = bump('subDomains');
    setSubDomainsState('loading');
    try {
      const items = await getSubDomains(id);
      if (mine !== turn.current.subDomains) return;
      setSubDomains(items);
      setSubDomainsState('ready');
    } catch (error) {
      if (mine !== turn.current.subDomains) return;
      setSubDomainsState('error');
      notifyApiError(error, 'Could not load the sub-domains.');
    }
  }, []);

  const chooseSubDomain = useCallback(async (id: string) => {
    setSubDomainId(id);
    clearBelow('subDomain');
    if (!id) return;
    const mine = bump('useCases');
    setUseCasesState('loading');
    try {
      const items = await getUseCases(id);
      if (mine !== turn.current.useCases) return;
      setUseCases(items);
      setUseCasesState('ready');
    } catch (error) {
      if (mine !== turn.current.useCases) return;
      setUseCasesState('error');
      notifyApiError(error, 'Could not load the use cases.');
    }
  }, []);

  const chooseUseCase = useCallback(async (id: string) => {
    setUseCaseId(id);
    clearBelow('useCase');
    if (!id) return;
    const mine = bump('journeys');
    setJourneysState('loading');
    try {
      const list = await getJourneys(id);
      const withScenarios = await Promise.all(
        list.map(async journey => ({ ...journey, scenarios: (await getScenarios(journey.id)).scenarios })),
      );
      if (mine !== turn.current.journeys) return;
      setJourneys(withScenarios);
      setJourneysState('ready');
    } catch (error) {
      if (mine !== turn.current.journeys) return;
      setJourneysState('error');
      notifyApiError(error, 'Could not load the customer journeys.');
    }
  }, []);

  return {
    industries, industriesState, loadIndustries,
    subDomains, subDomainsState, useCases, useCasesState, journeys, journeysState,
    industryId, subDomainId, useCaseId,
    chooseIndustry, chooseSubDomain, chooseUseCase,
  };
}
