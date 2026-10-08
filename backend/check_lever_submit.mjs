import puppeteer from 'puppeteer'

async function run() {
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()
  await page.goto('https://jobs.lever.co/activecampaign/207fd695-69b4-4696-893a-e20934983f92/apply', { waitUntil: 'networkidle2' })

  // Find all buttons or inputs of type submit
  const elements = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button, input, a, div'))
    return buttons
      .filter(el => {
        const text = (el.innerText || el.value || '').toLowerCase()
        return text.includes('submit') || el.id?.includes('submit') || el.className?.includes('submit') || el.type === 'submit'
      })
      .map(el => ({
        tagName: el.tagName,
        id: el.id,
        className: el.className,
        type: el.type,
        text: el.innerText || el.value || '',
        isVisible: el.offsetWidth > 0 && el.offsetHeight > 0
      }))
  })

  console.log('Detected potential submit elements:', JSON.stringify(elements, null, 2))
  await browser.close()
}

run().catch(console.error)
