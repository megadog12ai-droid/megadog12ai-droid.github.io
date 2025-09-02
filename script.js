document.addEventListener('DOMContentLoaded', () => {
    let formCounter = 1;

    const simpleFormContainer = document.getElementById('simple-form-container');
    const customFormContainer = document.getElementById('custom-form-container');
    const simpleModeBtn = document.getElementById('simple-mode-btn');
    const customModeBtn = document.getElementById('custom-mode-btn');

    const scaffoldingForms = document.getElementById('scaffolding-forms');
    const customScaffoldingForms = document.getElementById('custom-scaffolding-forms');
    const calculateBtn = document.getElementById('calculate-btn');

    const totalResultsDiv = document.getElementById('total-results');
    const totalKenDiv = document.getElementById('total-ken');
    const pipeCombinationsDetails = document.getElementById('pipe-combinations-details');
    const combinationDetailsList = document.getElementById('combination-details-list');

    const pipeLengths = [4, 2.5, 2, 1.5, 1];

    function createNewForm() {
        formCounter++;
        const newForm = document.createElement('div');
        newForm.classList.add('scaffolding-form');
        newForm.setAttribute('data-form-id', formCounter);
        newForm.innerHTML = `
            <button class="remove-btn">×</button>
            <div class="input-group">
                <label for="length-${formCounter}">足場の長さ</label>
                <div class="input-unit-toggle">
                    <input type="number" id="length-${formCounter}" class="length-input" step="0.5" placeholder="例: 5.4">
                    <select class="unit-select">
                        <option value="meter">m</option>
                        <option value="ken">間</option>
                    </select>
                </div>
            </div>
            <div class="input-group">
                <label for="height-${formCounter}">足場の高さ (m)</label>
                <input type="number" id="height-${formCounter}" class="height-input" step="0.5" placeholder="例: 8.0">
            </div>
            <div class="input-group">
                <label>設置場所</label>
                <div class="radio-group">
                    <input type="radio" id="location-concrete-${formCounter}" name="location-${formCounter}" value="concrete" checked>
                    <label for="location-concrete-${formCounter}">コンクリート</label>
                    <input type="radio" id="location-soil-${formCounter}" name="location-${formCounter}" value="soil">
                    <label for="location-soil-${formCounter}">土の地面</label>
                </div>
            </div>
        `;
        scaffoldingForms.appendChild(newForm);
        updateRemoveButtons();
    }

    function createNewCustomSection() {
        const newSection = document.createElement('div');
        newSection.classList.add('custom-section-form');
        const sectionCount = customScaffoldingForms.children.length + 1;
        newSection.setAttribute('data-section-id', sectionCount);
        newSection.innerHTML = `
            <button class="remove-btn">×</button>
            <h4>セクション #${sectionCount}</h4>
            <div class="input-group">
                <label for="custom-length-${sectionCount}">セクションの長さ</label>
                <div class="input-unit-toggle">
                    <input type="number" id="custom-length-${sectionCount}" class="custom-length-input" step="0.5" placeholder="例: 1.8">
                    <select class="unit-select">
                        <option value="meter">m</option>
                        <option value="ken">間</option>
                    </select>
                </div>
            </div>
            <div class="input-group">
                <label for="custom-height-${sectionCount}">セクションの高さ (m)</label>
                <input type="number" id="custom-height-${sectionCount}" class="custom-height-input" step="0.5" placeholder="例: 6.0">
            </div>
            <div class="input-group">
                <label>設置場所</label>
                <div class="radio-group">
                    <input type="radio" id="custom-location-concrete-${sectionCount}" name="custom-location-${sectionCount}" value="concrete" checked>
                    <label for="custom-location-concrete-${sectionCount}">コンクリート</label>
                    <input type="radio" id="custom-location-soil-${sectionCount}" name="custom-location-${sectionCount}" value="soil">
                    <label for="custom-location-soil-${sectionCount}">土の地面</label>
                </div>
            </div>
        `;
        customScaffoldingForms.appendChild(newSection);
        reNumberCustomSections();
        updateRemoveButtons();
    }
    
    function reNumberCustomSections() {
        const sections = document.querySelectorAll('#custom-scaffolding-forms .custom-section-form');
        sections.forEach((section, index) => {
            const newId = index + 1;
            section.setAttribute('data-section-id', newId);
            section.querySelector('h4').textContent = `セクション #${newId}`;
            
            section.querySelector('.custom-length-input').id = `custom-length-${newId}`;
            section.querySelector('.custom-height-input').id = `custom-height-${newId}`;
            
            const locationInputs = section.querySelectorAll('.radio-group input');
            const locationLabels = section.querySelectorAll('.radio-group label');

            locationInputs[0].id = `custom-location-concrete-${newId}`;
            locationInputs[0].name = `custom-location-${newId}`;
            locationLabels[0].htmlFor = `custom-location-concrete-${newId}`;

            locationInputs[1].id = `custom-location-soil-${newId}`;
            locationInputs[1].name = `custom-location-${newId}`;
            locationLabels[1].htmlFor = `custom-location-soil-${newId}`;
        });
    }

    function updateRemoveButtons() {
        const simpleForms = document.querySelectorAll('#scaffolding-forms .scaffolding-form');
        simpleForms.forEach(form => {
            const removeBtn = form.querySelector('.remove-btn');
            if (simpleForms.length > 1) {
                removeBtn.style.display = 'block';
            } else {
                removeBtn.style.display = 'none';
            }
        });

        const customSections = document.querySelectorAll('#custom-scaffolding-forms .custom-section-form');
        customSections.forEach(section => {
            const removeBtn = section.querySelector('.remove-btn');
            if (customSections.length > 1) {
                removeBtn.style.display = 'block';
            } else {
                removeBtn.style.display = 'none';
            }
        });
    }

    function calculateMaterials() {
        let totalPipes = {};
        let totalPerpendicularClamps = 0;
        let totalJoints = 0;
        let totalStakes = 0;
        let totalFreeClamps = 0;
        let totalBases = 0;
        let totalLengthInMeters = 0;
        
        pipeLengths.forEach(len => totalPipes[len] = 0);
        
        combinationDetailsList.innerHTML = '';
        pipeCombinationsDetails.style.display = 'none';

        let hasInvalidInput = false;

        const isSimpleMode = simpleFormContainer.style.display !== 'none';
        
        let formsToProcess;
        if (isSimpleMode) {
            formsToProcess = document.querySelectorAll('#scaffolding-forms .scaffolding-form');
        } else {
            formsToProcess = document.querySelectorAll('#custom-scaffolding-forms .custom-section-form');
        }

        if (formsToProcess.length === 0) {
             alert('足場の情報を入力してください。');
             return;
        }

        let sectionHeights = [];

        formsToProcess.forEach((form, index) => {
            let length, height, location;
            const unitSelect = form.querySelector('.unit-select');
            
            if (isSimpleMode) {
                const lengthInput = form.querySelector('.length-input');
                const heightInput = form.querySelector('.height-input');
                const formId = form.dataset.formId;
                length = parseFloat(lengthInput.value);
                height = parseFloat(heightInput.value);
                if (unitSelect.value === 'ken') {
                    length *= 1.8;
                }
                location = form.querySelector(`input[name="location-${formId}"]:checked`).value;
            } else {
                const lengthInput = form.querySelector('.custom-length-input');
                const heightInput = form.querySelector('.custom-height-input');
                const sectionId = form.dataset.sectionId;
                length = parseFloat(lengthInput.value);
                height = parseFloat(heightInput.value);
                if (unitSelect.value === 'ken') {
                    length *= 1.8;
                }
                location = form.querySelector(`input[name="custom-location-${sectionId}"]:checked`).value;
            }

            if (isNaN(length) || isNaN(height) || length <= 0 || height <= 0) {
                hasInvalidInput = true;
                return;
            }

            sectionHeights.push({ length, height });
            totalLengthInMeters += length;

            const numVerticalPipesPerSection = Math.ceil(length / 1.8) + 1;
            
            let heightPipes = [];
            
            const singlePipe = pipeLengths.find(p => Math.abs(height - p) < 0.01);
            if (singlePipe) {
                heightPipes.push(singlePipe);
            } else {
                function findExactCombination(target, pipes, currentComb = [], sum = 0) {
                    if (Math.abs(sum - target) < 0.01) {
                        return currentComb;
                    }
                    if (sum > target + 0.01) {
                        return null;
                    }
                    for (const pipe of pipes) {
                        const remainingPipes = pipes.slice(pipes.indexOf(pipe));
                        const result = findExactCombination(target, remainingPipes, [...currentComb, pipe], sum + pipe);
                        if (result) {
                            return result;
                        }
                    }
                    return null;
                }
                heightPipes = findExactCombination(height, pipeLengths.slice().sort((a,b) => b-a));
                
                if (!heightPipes) {
                    let remainingHeight = height;
                    while (remainingHeight > 0) {
                        let chosenPipe = pipeLengths[0];
                        if (remainingHeight < 4) {
                            chosenPipe = pipeLengths.find(len => len >= remainingHeight) || pipeLengths[pipeLengths.length - 1];
                        }
                        heightPipes.push(chosenPipe);
                        remainingHeight -= chosenPipe;
                    }
                }
            }

            if (heightPipes) {
                heightPipes.forEach(pipe => {
                    totalPipes[pipe] += numVerticalPipesPerSection;
                });
                if (heightPipes.length > 1) {
                    totalJoints += (heightPipes.length - 1) * numVerticalPipesPerSection;
                }
            }

            let numHorizontalLevels;
            if (height >= 5) {
                numHorizontalLevels = 5;
            } else {
                numHorizontalLevels = Math.ceil(height / 1.8);
            }
            
            totalPerpendicularClamps += numVerticalPipesPerSection * numHorizontalLevels;
            if (location === 'soil') {
                totalStakes += numVerticalPipesPerSection;
                totalFreeClamps += numVerticalPipesPerSection * 2;
            } else if (location === 'concrete') {
                totalBases += numVerticalPipesPerSection;
            }
        });
        
        if (hasInvalidInput) {
            alert('足場の長さと高さを正しく入力してください。');
            return;
        }

        // 各段ごとの横パイプの計算ロジック
        let maxHorizontalLevels = 0;
        sectionHeights.forEach(section => {
            let numLevels = Math.ceil(section.height / 1.8);
            if (section.height >= 5) {
                numLevels = 5;
            }
            if (numLevels > maxHorizontalLevels) {
                maxHorizontalLevels = numLevels;
            }
        });

        for (let i = 0; i < maxHorizontalLevels; i++) {
            let requiredLengthForLevel = 0;
            sectionHeights.forEach(section => {
                let numLevels = Math.ceil(section.height / 1.8);
                if (section.height >= 5) {
                    numLevels = 5;
                }
                if (i < numLevels) {
                    requiredLengthForLevel += section.length;
                }
            });

            if (requiredLengthForLevel > 0) {
                const requiredLength = requiredLengthForLevel + 0.1;
                function findBestCombination(target, pipes, currentComb = [], sum = 0) {
                    if (sum >= target) {
                        return { comb: currentComb, waste: sum - target };
                    }
                    let bestResult = null;
                    for (let j = 0; j < pipes.length; j++) {
                        const pipe = pipes[j];
                        const result = findBestCombination(target, pipes.slice(j), [...currentComb, pipe], sum + pipe);
                        if (result) {
                            if (!bestResult || result.waste < bestResult.waste) {
                                bestResult = result;
                            }
                        }
                    }
                    return bestResult;
                }
                
                const bestResult = findBestCombination(requiredLength, pipeLengths.slice().sort((a, b) => b - a));
                if (bestResult) {
                    const horizontalPipeCombination = bestResult.comb;
                    const combinationCounts = {};
                    horizontalPipeCombination.forEach(pipe => {
                        combinationCounts[pipe] = (combinationCounts[pipe] || 0) + 1;
                        totalPipes[pipe]++;
                    });
                    totalJoints += (horizontalPipeCombination.length - 1);
                    let combinationString = '';
                    for (const len in combinationCounts) {
                        combinationString += `${len}mパイプ: ${combinationCounts[len]}本, `;
                    }
                    combinationDetailsList.innerHTML += `<div class="combination-item"><p>横パイプ 段目 ${i + 1}: ${combinationString.slice(0, -2)}</p></div>`;
                    pipeCombinationsDetails.style.display = 'block';
                } else {
                    combinationDetailsList.innerHTML += `<div class="combination-item"><p>横パイプ 段目 ${i + 1}: 組み合わせが見つかりませんでした。</p></div>`;
                    pipeCombinationsDetails.style.display = 'block';
                }
            }
        }
        
        displayResults(totalPipes, totalPerpendicularClamps, totalJoints, totalStakes, totalFreeClamps, totalBases, totalLengthInMeters);
    }

    function displayResults(pipes, perpendicularClamps, joints, stakes, freeClamps, bases, totalMeters) {
        totalResultsDiv.innerHTML = '';
        
        let resultsHtml = '';
        
        pipeLengths.sort((a, b) => b - a).forEach(len => {
            if (pipes[len] > 0) {
                resultsHtml += `
                    <div class="result-item">
                        <h4>単管パイプ (${len}m)</h4>
                        <p>${pipes[len]} 本</p>
                    </div>
                `;
            }
        });

        if (stakes > 0) {
            resultsHtml += `
                <div class="result-item">
                    <h4>杭</h4>
                    <p>${stakes} 本</p>
                </div>
            `;
        }
        
        resultsHtml += `
            <div class="result-item">
                <h4>直交クランプ</h4>
                <p>${perpendicularClamps} 個</p>
            </div>
        `;
        
        if (freeClamps > 0) {
            resultsHtml += `
                <div class="result-item">
                    <h4>自在クランプ</h4>
                    <p>${freeClamps} 個</p>
                </div>
            `;
        }
        
        if (joints > 0) {
            resultsHtml += `
                <div class="result-item">
                    <h4>ジョイント</h4>
                    <p>${joints} 個</p>
                </div>
            `;
        }
        
        if (bases > 0) {
            resultsHtml += `
                <div class="result-item">
                    <h4>ベース</h4>
                    <p>${bases} 個</p>
                </div>
            `;
        }

        totalResultsDiv.innerHTML = resultsHtml;
        const totalKen = Math.round((totalMeters / 1.8) * 2) / 2;
        totalKenDiv.innerHTML = `<p>${totalKen.toFixed(1)} 間</p>`;
    }

    simpleModeBtn.addEventListener('click', () => {
        simpleFormContainer.style.display = 'block';
        customFormContainer.style.display = 'none';
        simpleModeBtn.classList.add('active');
        customModeBtn.classList.remove('active');
        updateRemoveButtons();
    });

    customModeBtn.addEventListener('click', () => {
        simpleFormContainer.style.display = 'none';
        customFormContainer.style.display = 'block';
        simpleModeBtn.classList.remove('active');
        customModeBtn.classList.add('active');
        if (customScaffoldingForms.children.length === 0) {
            createNewCustomSection();
        }
        updateRemoveButtons();
    });
    
    document.addEventListener('click', (event) => {
        if (event.target.id === 'add-scaffolding') {
            createNewForm();
        } else if (event.target.id === 'add-custom-section') {
            createNewCustomSection();
        } else if (event.target.id === 'calculate-btn') {
            calculateMaterials();
        } else if (event.target.classList.contains('remove-btn')) {
            const parentForm = event.target.closest('.scaffolding-form') || event.target.closest('.custom-section-form');
            if (parentForm) {
                parentForm.remove();
                if (simpleFormContainer.style.display === 'none') {
                    reNumberCustomSections();
                }
                updateRemoveButtons();
            }
        }
    });

    updateRemoveButtons();
});

