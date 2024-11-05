import fs from 'fs/promises';
import { parse } from 'csv-parse';
import { createReadStream } from 'fs';

async function processCSV() {
  try {
    const records = [];
    
    const parser = parse({
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    // Create readable stream
    const fileStream = createReadStream('src/data/honden.csv');

    // Pipe the file into the parser
    fileStream.pipe(parser);

    // Handle parsing
    for await (const record of parser) {
      const processedRecord = {
        ras: record.Breed,
        type: record.type.toLowerCase(),
        score: parseFloat(record.score),
        grootte: record.size === '1' ? 'klein' : record.size === '2' ? 'middelgroot' : 'groot',
        intelligentie: record.intelligence,
        geschiktKinderen: parseFloat(record['score for kids']),
        aandoeningen: record['congential ailments'] === 'none' ? 'geen' : record['congential ailments'],
        levenskosten: parseInt(record['$LIFETIME COST'].replace(/[^0-9]/g, '')),
        intelligentieRang: parseInt(record['INTELLIGENCE RANK']),
        levensverwachting: parseFloat(record['LONGEVITY(YEARS)']),
        description: generateDescription(record)
      };

      records.push(processedRecord);
    }

    // Ensure the data directory exists
    await fs.mkdir('src/data', { recursive: true });

    // Save processed data
    await fs.writeFile(
      'src/data/processedHonden.json', 
      JSON.stringify(records, null, 2)
    );

    console.log('Data processing complete! Created processedHonden.json');

  } catch (error) {
    console.error('Error processing CSV:', error);
    process.exit(1);
  }
}

function generateDescription(record) {
  // Generate a basic description based on the data
  const sizeText = {
    '1': 'kleine',
    '2': 'middelgrote',
    '3': 'grote'
  }[record.size];

  const healthText = record['congential ailments'] === 'none' 
    ? 'Dit ras staat bekend om zijn goede gezondheid en heeft geen specifieke erfelijke aandoeningen.'
    : `Bij dit ras komen de volgende gezondheidsproblemen voor: ${record['congential ailments']}.`;

  const intelligenceText = {
    'Brightest': 'zeer intelligent',
    'Excellent': 'uitstekend intelligent',
    'Above average': 'bovengemiddeld intelligent',
    'Average': 'gemiddeld intelligent',
    'Fair': 'redelijk intelligent',
    'Lowest': 'minder intelligent'
  }[record.intelligence];

  return `De ${record.Breed} is een ${sizeText} hond uit de ${record.type.toLowerCase()} groep. 
Dit ras staat bekend als ${intelligenceText} en heeft een gemiddelde levensverwachting van ${record['LONGEVITY(YEARS)']} jaar. 
${healthText}
Met een score van ${record['score for kids']}/5 voor geschiktheid met kinderen, is dit ${record['score for kids'] >= 4 ? 'een uitstekende gezinshond' : record['score for kids'] >= 3 ? 'een goede gezinshond' : 'een hond die extra aandacht vraagt bij gezinnen met kinderen'}.
De gemiddelde levensduurkosten voor dit ras bedragen ${record['$LIFETIME COST']}, inclusief voeding, verzorging en medische kosten.`;
}

// Run the processing
processCSV();