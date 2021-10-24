import styles from './MarkersView.module.css';
import { mapFilters, mapFiltersCategories } from './mapFilters';
import MarkerSection from './MarkerSection';
import { useFilters } from '../../contexts/FiltersContext';
import ActionButton from '../ActionControl/ActionButton';
import ActionCheckbox from '../ActionControl/ActionCheckbox';
import SearchIcon from '../icons/SearchIcon';
import { searchMapFilter } from './searchMapFilter';
import { usePersistentState } from '../../utils/storage';

function MarkersView(): JSX.Element {
  const [filters, setFilters] = useFilters();
  const [search, setSearch] = usePersistentState('searchMarkerTypes', '');

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
  }

  return (
    <section className={styles.container}>
      <div className={styles.actions}>
        <ActionCheckbox
          className={styles.action}
          onChange={(checked) => handleToggle(['hidden'], checked)}
          checked={filters.includes('hidden')}
          title="Show Hidden"
        />
      </div>
      <div className={styles.actions}>
        <label className={styles.search}>
          <SearchIcon />
          <input
            placeholder="Search marker types..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <ActionButton
          onClick={() => {
            handleToggle(
              mapFilters
                .filter(searchMapFilter(search))
                .map((filter) => filter.type),
              true
            );
          }}
        >
          Show all
        </ActionButton>
        <ActionButton
          onClick={() => {
            handleToggle(
              mapFilters
                .filter(searchMapFilter(search))
                .map((filter) => filter.type),
              false
            );
          }}
        >
          Hide all
        </ActionButton>
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
