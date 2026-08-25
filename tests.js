const results = document.querySelector('#results');
const summary = document.querySelector('#summary');
const frame = document.querySelector('#app');

function test(name, condition) {
  const item = document.createElement('li');
  item.textContent = `${condition ? 'PASS' : 'FAIL'} - ${name}`;
  item.className = condition ? 'pass' : 'fail';
  results.append(item);
  return condition;
}

frame.addEventListener('load', () => {
  const app = frame.contentDocument;
  const actors = () => app.querySelectorAll('.actor');
  const total = () => app.querySelector('#totalValue').textContent;
  let passed = 0;
  let failed = 0;
  const run = (name, condition) => {
    if (condition) {
      passed += 1;
      test(name, true);
    } else {
      failed += 1;
      test(name, false);
    }
  };

  run('case frame renders an incident title', app.querySelector('#incidentTitle')?.value === 'Warehouse navigation deviation');
  run('four default responsibility sources render', actors().length === 4);
  run('default attribution is balanced at 100%', total() === '100%');

  const firstSlider = app.querySelector('.actor input[type="range"]');
  firstSlider.value = '45';
  firstSlider.dispatchEvent(new Event('input', { bubbles: true }));
  run('changing a source updates its displayed percentage', actors()[0].querySelector('.actor-value').textContent === '45%');

  app.querySelector('#addActor').click();
  run('adding a source creates a new responsibility row', actors().length === 5);

  app.querySelector('[data-remove="4"]').click();
  run('removing a source removes the selected row', actors().length === 4);

  summary.textContent = `${passed} passed, ${failed} failed`;
});
