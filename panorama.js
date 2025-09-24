const panoramasData = {
    exhibit1: {
        title: "КАЗАНЬ – ГОРОД ТРУДОВОЙ ДОБЛЕСТИ || ТЫЛ ФРОНТУ!",
        image: "panorams/exhibit1.jpg"
    },
    exhibit2: {
        title: "БЛОКАДНЫЙ ЛЕНИНГРАД",
        image: "panorams/exhibit2.jpg"
    },
    exhibit3: {
        title: "СТАЛИНГРАДСКАЯ БИТВА",
        image: "panorams/exhibit3.jpg"
    },
    exhibit4: {
        title: "ОСВОБОЖДЕНИЕ ЕВРОПЫ || ПОБЕДА || ПАМЯТЬ",
        image: "panorams/exhibit4.jpg"
    }
};

// Глобальные переменные
let currentViewer = null;
let currentScene = null;
let currentPanoramaId = 'exhibit1';

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log('Страница загружена, инициализация...');
    initializePanoramaViewer();
    setupEventListeners();
    loadPanoramaFromURL();
});

// Инициализация просмотрщика панорам
function initializePanoramaViewer() {
    const container = document.getElementById('panorama-container');
    
    if (!container) {
        console.error('Контейнер панорамы не найден');
        return;
    }
    
    // Очищаем контейнер
    container.innerHTML = '';
    
    // Создаем индикатор загрузки
    const loadingSpinner = document.createElement('div');
    loadingSpinner.className = 'loading-spinner';
    loadingSpinner.innerHTML = `
        <i class="fas fa-sync fa-spin"></i>
        <p>Загрузка панорамы...</p>
    `;
    container.appendChild(loadingSpinner);

    try {
        // Инициализируем Marzipano
        currentViewer = new Marzipano.Viewer(container, {
            controls: { 
                mouseViewMode: 'drag',
                scrollToZoom: false
            }
        });

        console.log('Marzipano инициализирован успешно');

    } catch (error) {
        console.error('Ошибка инициализации Marzipano:', error);
        showError('Не удалось загрузить просмотрщик панорам');
    }
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Кнопки навигации по панорамам
    const panoramaButtons = document.querySelectorAll('.panorama-btn');
    if (panoramaButtons.length === 0) {
        console.warn('Кнопки панорам не найдены');
        return;
    }
    
    panoramaButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const panoramaId = this.getAttribute('data-panorama');
            console.log('Переключение на панораму:', panoramaId);
            switchPanorama(panoramaId);
        });
    });

    // Элементы управления
    const zoomInBtn = document.getElementById('zoom-in');
    const zoomOutBtn = document.getElementById('zoom-out');
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    
    if (zoomInBtn) zoomInBtn.addEventListener('click', zoomIn);
    if (zoomOutBtn) zoomOutBtn.addEventListener('click', zoomOut);
    if (fullscreenBtn) fullscreenBtn.addEventListener('click', toggleFullscreen);

    // Обработка полноэкранного режима
    document.addEventListener('fullscreenchange', handleFullscreenChange);
}

// Загрузка панорамы из параметров URL
function loadPanoramaFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const panoramaId = urlParams.get('panorama');
    
    console.log('Загрузка из URL, panoramaId:', panoramaId);
    
    if (panoramaId && panoramasData[panoramaId]) {
        switchPanorama(panoramaId);
    } else {
        switchPanorama('exhibit1');
    }
}

// Переключение между панорамами
function switchPanorama(panoramaId) {
    console.log('switchPanorama called with:', panoramaId);
    
    if (!panoramasData[panoramaId]) {
        console.error('Панорама не найдена:', panoramaId);
        return;
    }

    // Обновляем активную кнопку
    updateActiveButton(panoramaId);

    // Обновляем информацию о панораме
    updatePanoramaInfo(panoramaId);

    // Обновляем URL без перезагрузки страницы
    history.replaceState(null, '', `?panorama=${panoramaId}`);

    // Загружаем панораму
    loadPanorama(panoramaId);
}

// Обновление активной кнопки навигации
function updateActiveButton(panoramaId) {
    document.querySelectorAll('.panorama-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-panorama') === panoramaId) {
            btn.classList.add('active');
        }
    });
}

// Обновление информации о панораме
function updatePanoramaInfo(panoramaId) {
    const panorama = panoramasData[panoramaId];
    const titleElement = document.getElementById('panorama-title');
    
    if (titleElement) titleElement.textContent = panorama.title;
}

// Загрузка и отображение панорамы
function loadPanorama(panoramaId) {
    console.log('loadPanorama called with:', panoramaId);
    
    const panorama = panoramasData[panoramaId];
    if (!panorama) {
        console.error('Данные панорамы не найдены:', panoramaId);
        return;
    }

    const container = document.getElementById('panorama-container');
    if (!container) {
        console.error('Контейнер панорамы не найден');
        return;
    }
    
    // Показываем индикатор загрузки
    let loadingSpinner = container.querySelector('.loading-spinner');
    if (!loadingSpinner) {
        loadingSpinner = document.createElement('div');
        loadingSpinner.className = 'loading-spinner';
        loadingSpinner.innerHTML = `
            <i class="fas fa-sync fa-spin"></i>
            <p>Загрузка панорамы...</p>
        `;
        container.appendChild(loadingSpinner);
    }
    loadingSpinner.style.display = 'flex';

    if (!currentViewer) {
        console.error('Просмотрщик панорам не инициализирован');
        loadingSpinner.style.display = 'none';
        return;
    }

    try {
        // Создаем источник изображения
        const source = Marzipano.ImageUrlSource.fromString(panorama.image);
        console.log('Источник изображения создан:', panorama.image);

        // Создаем геометрию
        const geometry = new Marzipano.EquirectGeometry([{ width: 4000 }]);
        console.log('Геометрия создана');

        // Настройки просмотра
        const limiter = Marzipano.RectilinearView.limit.traditional(4000, 100 * Math.PI / 180);
        const view = new Marzipano.RectilinearView(null, limiter);
        console.log('Настройки просмотра созданы');

        // Создаем сцену
        const scene = currentViewer.createScene({
            source: source,
            geometry: geometry,
            view: view,
            pinFirstLevel: true
        });
        console.log('Сцена создана');

        // Переключаемся на новую сцену
        scene.switchTo({
            transitionDuration: 1000
        });
        
        console.log('Переключение на сцену выполнено');

        // Скрываем индикатор загрузки
        setTimeout(() => {
            if (loadingSpinner) {
                loadingSpinner.style.display = 'none';
            }
        }, 500);
        
        currentScene = scene;
        currentPanoramaId = panoramaId;
        
        console.log('Панорама успешно загружена:', panoramaId);

    } catch (error) {
        console.error('Ошибка создания сцены:', error);
        showError('Ошибка загрузки панорамы: ' + error.message);
        
        if (loadingSpinner) {
            loadingSpinner.style.display = 'none';
        }
    }
}

// Управление масштабом
function zoomIn() {
    if (currentScene && currentScene.view()) {
        const view = currentScene.view();
        const currentFov = view.fov();
        const newFov = Math.max(currentFov * 0.8, 30 * Math.PI / 180);
        view.setFov(newFov);
    }
}

function zoomOut() {
    if (currentScene && currentScene.view()) {
        const view = currentScene.view();
        const currentFov = view.fov();
        const newFov = Math.min(currentFov * 1.2, 120 * Math.PI / 180);
        view.setFov(newFov);
    }
}

// Полноэкранный режим
function toggleFullscreen() {
    const container = document.getElementById('panorama-container');
    if (!container) return;
    
    if (!document.fullscreenElement) {
        if (container.requestFullscreen) {
            container.requestFullscreen();
        } else if (container.webkitRequestFullscreen) {
            container.webkitRequestFullscreen();
        } else if (container.msRequestFullscreen) {
            container.msRequestFullscreen();
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }
}

function handleFullscreenChange() {
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    if (!fullscreenBtn) return;
    
    const icon = fullscreenBtn.querySelector('i');
    if (!icon) return;
    
    if (document.fullscreenElement) {
        icon.className = 'fas fa-compress';
    } else {
        icon.className = 'fas fa-expand';
    }
}

// Показать сообщение об ошибке
function showError(message) {
    const container = document.getElementById('panorama-container');
    if (!container) return;
    
    container.innerHTML = `
        <div style="color: white; text-align: center; padding: 2rem; display: flex; flex-direction: column; justify-content: center; height: 100%; background: #000;">
            <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem;"></i>
            <h3>Ошибка загрузки</h3>
            <p>${message}</p>
            <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #e67e22; border: none; border-radius: 5px; color: white; cursor: pointer;">
                Попробовать снова
            </button>
        </div>
    `;
}

// Проверка поддержки WebGL
function checkWebGLSupport() {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        return !!gl;
    } catch (e) {
        return false;
    }
}

// Автоматическая проверка WebGL при загрузке
if (!checkWebGLSupport()) {
    document.addEventListener('DOMContentLoaded', function() {
        showError('Ваш браузер не поддерживает WebGL. Пожалуйста, обновите браузер или используйте другой.');
    });
}