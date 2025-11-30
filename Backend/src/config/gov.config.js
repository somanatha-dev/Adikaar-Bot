// Centralized configuration for Indian government query detection and portal hints.
// Update keywords or portal mapping here without touching core logic.

module.exports = {
  keywords: [
    'aadhaar','aadhar','uidai','pan card','pan number','income tax','itr','voter id','epic number','nvsp','ration card','pm kisan','kisan samman','ayushman','ayushman bharat','pmjay','abha id','health id','jan dhan','pmjdy','udyam','gst','digital india','digilocker','scheme','yojana','subsidy','scholarship','national scholarship','skill india','startup india','msme','pension','pf account','employees provident fund','epfo','labour card','passport india','seva kendra','uidai','npci','upi','rti','right to information','ministry of','govt of india','government of india','state government','central government','pmay','swachh bharat','jal jeevan','fssai','cowin','parivahan','eshram',
    // Hindi terms
    'आधार','पैन','वोटर आईडी','मतदाता पहचान पत्र','योजना','पेंशन','छात्रवृत्ति','सब्सिडी','किसान','प्रधानमंत्री किसान','स्वच्छ भारत','जल जीवन','आयुष्मान','कौशल','स्टार्टअप','स्वावलंबन','भत्ता','परिवहन','पासपोर्ट','आरटीआई','सरकार','भारत सरकार','राज्य सरकार','केरल','कर्नाटक','महाराष्ट्र','दिल्ली','तमिलनाडु'
  ],
  // Portal mapping now supports hierarchical structure:
  // portals: { global: { ..generic.. }, states: { maharashtra: {..}, ... } }
  portals: {
    global: {
      aadhaar: 'https://uidai.gov.in',
      uidai: 'https://uidai.gov.in',
      myaadhaar: 'https://myaadhaar.uidai.gov.in',
      'pan card': 'https://www.incometax.gov.in',
      itr: 'https://www.incometax.gov.in',
      'income tax': 'https://www.incometax.gov.in',
      'voter id': 'https://www.nvsp.in',
      nvsp: 'https://www.nvsp.in',
      ration: 'https://nfsa.gov.in',
      'pm kisan': 'https://pmkisan.gov.in',
      ayushman: 'https://pmjay.gov.in',
      pmjay: 'https://pmjay.gov.in',
      'abha id': 'https://healthid.ndhm.gov.in',
      'health id': 'https://healthid.ndhm.gov.in',
      'jan dhan': 'https://pmjdy.gov.in',
      pmjdy: 'https://pmjdy.gov.in',
      udyam: 'https://udyamregistration.gov.in',
      gst: 'https://www.gst.gov.in',
      digilocker: 'https://www.digilocker.gov.in',
      scholarship: 'https://scholarships.gov.in',
      'national scholarship': 'https://scholarships.gov.in',
      'startup india': 'https://www.startupindia.gov.in',
      msme: 'https://msme.gov.in',
      epfo: 'https://www.epfindia.gov.in',
      pension: 'https://www.epfindia.gov.in',
      passport: 'https://www.passportindia.gov.in',
      npci: 'https://www.npci.org.in',
      upi: 'https://www.npci.org.in/what-we-do/upi',
      rti: 'https://rti.gov.in',
      pmay: 'https://pmaymis.gov.in',
      'swachh bharat': 'https://swachhbharatmission.gov.in',
      'jal jeevan': 'https://jaljeevanmission.gov.in',
      cowin: 'https://www.cowin.gov.in',
      parivahan: 'https://parivahan.gov.in',
      eshram: 'https://eshram.gov.in'
    },
    states: {
      maharashtra: {
        maharashtra: 'https://www.maharashtra.gov.in',
        aaplesarkar: 'https://aaplesarkar.mahaonline.gov.in',
        mahadbt: 'https://mahadbt.maharashtra.gov.in'
      },
      karnataka: {
        karnataka: 'https://www.karnataka.gov.in',
        'seva sindhu': 'https://sevasindhu.karnataka.gov.in',
        khajane: 'https://khajane2.karnataka.gov.in'
      },
      tamilnadu: {
        tamilnadu: 'https://www.tn.gov.in',
        'tn e-sevai': 'https://www.tnesevai.tn.gov.in',
        tneb: 'https://www.tnebnet.org'
      },
      delhi: {
        delhi: 'https://delhi.gov.in',
        'delhi edistrict': 'https://edistrict.delhigovt.nic.in'
      },
      kerala: {
        kerala: 'https://kerala.gov.in',
        'sevana pension': 'https://welfare.lsgkerala.gov.in'
      }
    }
  },
  aliases: {
    ka: 'karnataka',
    karnataka: 'karnataka',
    tn: 'tamilnadu',
    'tamil nadu': 'tamilnadu',
    mh: 'maharashtra',
    maharashtra: 'maharashtra',
    dl: 'delhi',
    delhi: 'delhi',
    ker: 'kerala',
    kerala: 'kerala'
  }
};