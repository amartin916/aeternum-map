import styles from './MarkersView.module.css';
import { mapFiltersCategories } from './mapFilters';
import MarkerSection from './MarkerSection';
import { useFilters } from '../../contexts/FiltersContext';
import ActionButton from '../ActionControl/ActionButton';
import ActionCheckbox from '../ActionControl/ActionCheckbox';
import { usePersistentState } from '../../utils/storage';
import { useAccount } from '../../contexts/UserContext';
import SearchInput from '../SearchInput/SearchInput';
import PresetSelect from '../PresetSelect/PresetSelect';
import { useState } from 'react';
import type { Preset } from '../PresetSelect/presets';

type MarkersViewProps = {
  onAdd: () => void;
};
function MarkersView({ onAdd }: MarkersViewProps): JSX.Element {
  const [filters, setFilters] = useFilters();
  const [search, setSearch] = usePersistentState('searchMarkerTypes', '');
  const [preset, setPreset] = useState<Preset | null>(null);
  const { account } = useAccount();

  function handleToggle(filterTypes: string[], checked: boolean) {
    const newFilters = [...filters];
    if (checked) {
      newFilters.push(...filterTypes);
    } else {
      filterTypes.forEach((filterType) => {
        const index = newFilters.indexOf(filterType);
        if (index !== -1) {
          newFilters.splice(newFilters.indexOf(filterType), 1);
        }
      });
    }
    const uniqueFilters = Array.from(new Set(newFilters));
    setFilters(uniqueFilters);
    setPreset(null);
  }

  return (
    <section className={styles.container}>
      <div className={styles.actions}>
        <ActionButton disabled={!account} onClick={onAdd}>
          {account ? 'Add resource' : 'Login to add resource'}
        </ActionButton>
        <ActionCheckbox
          className={styles.action}
          onChange={(checked) => handleToggle(['hidden'], checked)}
          checked={filters.includes('hidden')}
          title="Toggle Hidden"
        />
      </div>
      <div className={styles.actions}>
        <SearchInput
          placeholder="Search marker types..."
          value={search}
          onChange={setSearch}
        />
        <PresetSelect
          value={preset}
          onChange={(preset) => {
            setPreset(preset);
            if (preset) {
              setFilters(preset.types);
            }
          }}
        />
      </div>
      <div className={styles.list}>
        {mapFiltersCategories.map((mapFilterCategory) => (
          <MarkerSection
            key={mapFilterCategory.value}
            mapFilterCategory={mapFilterCategory}
            filters={filters}
            onToggle={handleToggle}
            search={search}
          />
        ))}
      </div>
    </section>
  );
}

export default MarkersView;
