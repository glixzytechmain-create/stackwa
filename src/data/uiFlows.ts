import { UiDesignChallenge } from '../types';

export const UI_CHALLENGES: UiDesignChallenge[] = [
  {
    id: 'linear-command-palette',
    title: 'Linear — Command Palette & Fuzzy Search Flow',
    company: 'Linear',
    patternType: 'Command Palette',
    mobbinScreenUrl: 'linear-cmd-k',
    appContext: 'A blazing-fast developer productivity tool where keyboard power-users trigger actions, navigate pages, and create issues without touching the mouse.',
    userStory: 'As an engineer, I want to press Cmd+K anywhere in the app, type a keyword, see filtered commands instantly, and execute actions with the Enter key.',
    keyRequirements: [
      'Accessible keyboard navigation (Arrow Up/Down, Enter to select, Escape to dismiss).',
      'Fuzzy filtering across navigation items, recent issues, and workspace commands.',
      'Grouped list view with category headers (e.g. Navigation, Actions, Issues).',
      'Focus trap within modal while open, restoring focus to previous element upon close.'
    ],
    edgeCases: [
      {
        scenario: 'User types gibberish with no matches',
        expectedBehavior: 'Render an empty-state illustration with a quick button to "Create issue with this title".'
      },
      {
        scenario: 'Command list exceeds viewport height',
        expectedBehavior: 'Implement virtualized scrolling (e.g. react-window) so 5,000 workspace items render at 60fps without DOM lag.'
      },
      {
        scenario: 'Network goes offline while searching server-side issues',
        expectedBehavior: 'Fallback instantly to cached local commands and display an offline badge next to server results.'
      }
    ],
    recommendedComponentTree: [
      {
        id: 'palette-root',
        name: 'CommandPaletteModal',
        type: 'container',
        description: 'Handles backdrop blur, focus trapping, and keyboard shortcuts listeners.',
        stateUsed: ['isOpen', 'activeSelectedIndex'],
        props: ['onClose', 'commandsList']
      },
      {
        id: 'palette-input',
        name: 'CommandSearchInput',
        type: 'molecule',
        description: 'Auto-focused input with debounced query change and clear button.',
        stateUsed: ['searchQuery'],
        props: ['value', 'onChange', 'onKeyDown']
      },
      {
        id: 'palette-list',
        name: 'CommandGroupList',
        type: 'organism',
        description: 'Renders categorized commands with accessibility aria-selected flags.',
        stateUsed: ['highlightedIndex'],
        props: ['groupedItems', 'onSelect']
      },
      {
        id: 'palette-item',
        name: 'CommandItemRow',
        type: 'atom',
        description: 'Individual command row displaying icon, title, description, and keyboard shortcut badge.',
        stateUsed: [],
        props: ['icon', 'label', 'shortcut', 'isSelected']
      }
    ],
    stateArchitectureGuide: {
      localState: [
        'searchQuery (string): Current input value for filtering.',
        'highlightedIndex (number): Currently focused command index for keyboard navigation.',
        'isComposing (boolean): IME composition state for international characters.'
      ],
      globalState: [
        'isPaletteOpen (boolean): Controls modal visibility across all routes.',
        'recentCommands (array): Last 5 executed commands persisted across sessions.'
      ],
      serverCacheState: [
        'workspaceIssues (TanStack Query / SWR): Pre-cached list of recent user issues for instant client-side fuzzy searching.'
      ]
    },
    interactiveQuiz: [
      {
        question: 'Where should the `searchQuery` state be managed?',
        options: [
          'In the global Redux/Zustand store',
          'Locally inside the CommandPalette component (or custom hook)',
          'In local storage on every keystroke',
          'On the server database'
        ],
        correctIndex: 1,
        explanation: 'The search query only matters while the palette is open. Storing it locally avoids unnecessary global re-renders on every keystroke.'
      },
      {
        question: 'How should keyboard navigation (Arrow Up/Down) behave when reaching the end of the list?',
        options: [
          'Stop at the last item',
          'Cycle/wrap around back to the first item for seamless power-user flow',
          'Close the palette',
          'Clear the search query'
        ],
        correctIndex: 1,
        explanation: 'Top-tier command palettes like Linear and VS Code wrap around to the first item, making continuous keyboard navigation smooth.'
      }
    ]
  },
  {
    id: 'airbnb-filter-drawer',
    title: 'Airbnb — Filter Modal & Live Map Sync Flow',
    company: 'Airbnb',
    patternType: 'Filter & Drawer',
    mobbinScreenUrl: 'airbnb-filter',
    appContext: 'A high-converting accommodation search experience where travelers filter by price histogram, room types, amenities, and booking options with instant count updates.',
    userStory: 'As a traveler, I want to open filters, adjust price sliders, toggle amenities, see how many stays match before applying, and apply or clear all with one tap.',
    keyRequirements: [
      'Dual-thumb range slider for min/max nightly pricing.',
      'Draft state: Changes in the modal must not alter the main search results until the user clicks "Show X stays".',
      'URL sync: Applied filters must sync to URL query parameters for shareability and back-button support.',
      'Clear All action resets draft filters back to defaults.'
    ],
    edgeCases: [
      {
        scenario: 'User closes modal via backdrop click without clicking "Show stays"',
        expectedBehavior: 'Discard unapplied draft filter changes and revert to the previously applied state.'
      },
      {
        scenario: 'User drags minPrice slider past maxPrice slider',
        expectedBehavior: 'Enforce minimum gap between thumbs or push the adjacent thumb dynamically.'
      },
      {
        scenario: 'Selected combination returns 0 available homes',
        expectedBehavior: 'Update footer button to "No stays found" and highlight the most restrictive filter (e.g. "Try widening price range").'
      }
    ],
    recommendedComponentTree: [
      {
        id: 'filter-drawer-root',
        name: 'FilterDrawerModal',
        type: 'container',
        description: 'Controls drawer transition, body scroll lock, and draft state lifecycle.',
        stateUsed: ['isOpen', 'draftFilters'],
        props: ['initialFilters', 'onApply', 'onClose']
      },
      {
        id: 'price-histogram',
        name: 'PriceHistogramSlider',
        type: 'organism',
        description: 'Interactive SVG bar chart displaying distribution of prices with dual slider handles.',
        stateUsed: ['sliderMin', 'sliderMax'],
        props: ['histogramData', 'currency', 'onChange']
      },
      {
        id: 'amenities-grid',
        name: 'AmenitiesCheckboxGroup',
        type: 'molecule',
        description: 'Multi-select pill or checkbox grid with icons for WiFi, Pool, Pet-friendly, etc.',
        stateUsed: ['selectedAmenityIds'],
        props: ['availableAmenities', 'onToggle']
      },
      {
        id: 'filter-footer',
        name: 'StickyFilterFooter',
        type: 'molecule',
        description: 'Sticky bottom bar with "Clear all" text button and dynamic "Show [N] stays" CTA button.',
        stateUsed: ['isMatchingCountLoading'],
        props: ['matchingCount', 'onClear', 'onApply']
      }
    ],
    stateArchitectureGuide: {
      localState: [
        'draftFilters (object): Cloned filter state manipulated inside the modal.',
        'isDirty (boolean): True if draftFilters differs from appliedFilters.'
      ],
      globalState: [
        'appliedFilters (object): Active filters controlling the property list and map markers.',
        'mapBounds (object): Geographic coordinates currently visible.'
      ],
      serverCacheState: [
        'previewCount (React Query): Lightweight debounced count query fetching matching property counts for the draft filters.'
      ]
    },
    interactiveQuiz: [
      {
        question: 'Why must filters use a separate `draftFilters` state inside the modal?',
        options: [
          'To prevent the background search results and map from re-fetching on every slider tick',
          'Because React does not allow direct state editing',
          'To save database memory',
          'To avoid using URL query params'
        ],
        correctIndex: 0,
        explanation: 'If filters directly updated global state, dragging a price slider would trigger dozens of expensive network calls to the map and listings API!'
      }
    ]
  },
  {
    id: 'spotify-queue-drawer',
    title: 'Spotify — Persistent Mini-Player & Queue Reordering',
    company: 'Spotify',
    patternType: 'Feed & Infinite Scroll',
    mobbinScreenUrl: 'spotify-queue',
    appContext: 'A global music streaming app where audio playback must persist continuously across all screen transitions while allowing users to inspect and reorder upcoming tracks.',
    userStory: 'As a music listener, I want to see what track is playing on any page, expand the queue, and drag-and-drop tracks to change what plays next without interrupting audio.',
    keyRequirements: [
      'Persistent bottom mini-player that remains mounted during page navigation.',
      'Full-height slide-up queue sheet with "Now Playing", "Next in Queue", and "Next from Playlist".',
      'Drag-and-drop reordering for items in the user queue.',
      'Optimistic updates: track reordering updates the UI instantly, syncing with backend in background.'
    ],
    edgeCases: [
      {
        scenario: 'User drags current playing song into the upcoming queue',
        expectedBehavior: 'Disallow reordering the active playing track; only upcoming items should be draggable.'
      },
      {
        scenario: 'User closes tab or refreshes page mid-song',
        expectedBehavior: 'Persist playback timestamp and queue state in LocalStorage/IndexedDB to resume seamlessly.'
      }
    ],
    recommendedComponentTree: [
      {
        id: 'persistent-player',
        name: 'GlobalAudioPlayerLayout',
        type: 'container',
        description: 'Houses the HTML5 Audio singleton, mini-player bar, and expands into the queue modal.',
        stateUsed: ['isPlaying', 'currentTime', 'isQueueOpen'],
        props: ['children']
      },
      {
        id: 'queue-sheet',
        name: 'QueueDrawerSheet',
        type: 'organism',
        description: 'Draggable bottom sheet rendering categorized track sections.',
        stateUsed: ['queueItems'],
        props: ['activeTrack', 'onReorder', 'onRemoveTrack']
      }
    ],
    stateArchitectureGuide: {
      localState: ['draggedItemId (string): Track currently being dragged.'],
      globalState: [
        'playbackState: { currentTrack, isPlaying, volume, progress }',
        'activeQueue: Track[]',
        'history: Track[]'
      ],
      serverCacheState: [
        'trackStreamUrl: Audio buffer pre-fetching next 2 tracks for zero-latency gapless playback.'
      ]
    },
    interactiveQuiz: [
      {
        question: 'Where should the `<audio>` element be mounted in the React component tree?',
        options: [
          'Inside the route page component (e.g. AlbumPage)',
          'At the root application layout above all router outlets',
          'Inside the modal sheet',
          'Inside each song row component'
        ],
        correctIndex: 1,
        explanation: 'Mounting the audio element at the root level ensures playback is never unmounted or interrupted when the user navigates between different pages.'
      }
    ]
  }
];
