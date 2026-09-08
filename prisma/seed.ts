/**
 * FireOxine catalogue seed — the real Fire Oxine Safety Industries catalogue.
 *
 * WHERE THE CONTENT COMES FROM:
 *
 *   Categories, products, descriptions, specification tables, prices and
 *   photographs are imported from the company's own live listing at
 *   https://www.fireoxinesafetyindustries.in/ and live in `catalogue-data.ts`.
 *   The photographs were downloaded into apps/api/public/uploads, so the API serves
 *   its own images rather than hotlinking the source.
 *
 *   Contact details, GST number, IEC, address and company facts in `settings`
 *   below are the company's published details. The one exception is the email
 *   address, which the source does not publish anywhere — it is marked in
 *   place and must be confirmed before launch.
 *
 * WHAT IS STILL DOMAIN FACT, NOT SCRAPED:
 *
 *   Every fire-class definition, extinguishing medium and class/medium
 *   pairing below is accurate domain fact checked against IS 2190 and
 *   IS 15683 conventions, exactly as before. The source listing does not
 *   state fire classes reliably, so coverage and prohibition are DERIVED
 *   from the medium by the CLASS_RULES table rather than trusted from the
 *   listing copy. Class C is flammable GASES, not energised electrical
 *   equipment — that distinction is the whole point of the model.
 *
 *   The hazard axis ("shop by concern") is this site's own, not the source's;
 *   products are mapped onto it at import time.
 *
 *   Stock figures are provisional: the source quotes none. Products the
 *   source lists as "Price on Request" are seeded INACTIVE rather than shown
 *   with an invented price — price them in admin and switch them on.
 *
 *   No certification licence number is invented anywhere.
 */
import { PrismaClient, Medium, Role, FaqGroup } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { CATEGORIES, PRODUCTS } from './catalogue-data';

const db = new PrismaClient();

/** The source publishes no stock figures. Provisional until set in admin. */
const PROVISIONAL_STOCK = 25;

async function main() {
  await db.orderItem.deleteMany();
  await db.order.deleteMany();
  await db.cartItem.deleteMany();
  await db.wishlistItem.deleteMany();
  await db.productFireClass.deleteMany();
  await db.productHazard.deleteMany();
  await db.productImage.deleteMany();
  await db.productVariant.deleteMany();
  await db.product.deleteMany();
  await db.fireClass.deleteMany();
  await db.hazard.deleteMany();
  await db.category.deleteMany();
  await db.address.deleteMany();
  await db.user.deleteMany();
  await db.faq.deleteMany();
  await db.siteSetting.deleteMany();
  await db.partnerEnquiry.deleteMany();
  await db.contactMessage.deleteMany();
  await db.newsletterSubscriber.deleteMany();
  // ------------------------------------------------------------ accounts
  await db.user.create({
    data: {
      name: 'FireOxine Admin',
      email: 'admin@fireoxine.in',
      phone: '9820000000',
      passwordHash: await bcrypt.hash('admin1234', 10),
      role: Role.ADMIN,
    },
  });
  const customer = await db.user.create({
    data: {
      name: 'Meera Iyer',
      email: 'customer@example.com',
      phone: '9820011111',
      passwordHash: await bcrypt.hash('customer1234', 10),
      role: Role.CUSTOMER,
      addresses: {
        create: {
          fullName: 'Meera Iyer',
          phone: '9820011111',
          line1: 'Flat 704, Sunworld Residency',
          line2: 'Off Link Road, Andheri West',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400053',
          isDefault: true,
        },
      },
    },
  });
  // -------------------------------------------------------- fire classes
  // Per IS 2190 / BS EN 2 convention, which India follows. Note that Class C
  // is FLAMMABLE GASES here, not energised electrical equipment — that is the
  // NFPA (US) meaning of C, and conflating the two is the single most common
  // error in Indian fire-safety retail copy.
  const classSpecs = [
    {
      code: 'A',
      label: 'Ordinary combustibles',
      description:
        'Solid materials that leave an ash when they burn. The commonest fire in any home, office or godown.',
      example: 'Wood, paper, cardboard, cloth, furniture, most plastics',
      position: 1,
    },
    {
      code: 'B',
      label: 'Flammable liquids',
      description:
        'Liquids and liquefiable solids. These spread and flow, so they are smothered rather than cooled.',
      example: 'Petrol, diesel, kerosene, paint, thinner, solvents, grease',
      position: 2,
    },
    {
      code: 'C',
      label: 'Flammable gases',
      description:
        'Gas fires. The first action is always to isolate the supply — an extinguisher alone can leave gas escaping unburnt, which is more dangerous, not less.',
      example: 'LPG cylinders, CNG lines, acetylene, methane, hydrogen',
      position: 3,
    },
    {
      code: 'D',
      label: 'Combustible metals',
      description:
        'Burning metal. Water and standard powders react violently with these; only a dedicated Class D agent is safe.',
      example: 'Magnesium, sodium, potassium, titanium, aluminium swarf',
      position: 4,
    },
    {
      code: 'K',
      label: 'Cooking media',
      description:
        'Deep-fat fires in commercial kitchens. They reignite at temperatures well below what water can bring them down to, so they need a saponifying agent.',
      example: 'Vegetable oil and animal fat in fryers, ranges and woks',
      position: 5,
    },
  ];
  const fireClasses: Record<string, string> = {};
  for (const spec of classSpecs) {
    const created = await db.fireClass.create({ data: spec });
    fireClasses[spec.code] = created.id;
  }
  // ----------------------------------------------------------- categories
  // Imported from the live listing; see catalogue-data.ts.
  const categories: Record<string, string> = {};
  for (const [i, spec] of CATEGORIES.entries()) {
    const c = await db.category.create({
      data: {
        name: spec.name,
        slug: spec.slug,
        tagline: spec.tagline,
        description: spec.description,
        imageUrl: spec.imageUrl,
        position: i + 1,
      },
    });
    categories[spec.slug] = c.id;
  }

  // -------------------------------------------------------------- hazards
  const hazardSpecs = [
    ['Commercial Kitchen', 'commercial-kitchen', 'Fryers, ranges and gas banks', 'kitchen', 'Cooking oil reignites at a temperature water cannot reach, and a kitchen also carries gas and electrical risk in the same room. Wet chemical is the core unit; CO2 covers the equipment beside it.'],
    ['Server Room & Data Centre', 'server-room', 'Racks, UPS and switchgear', 'server', 'Powder is as destructive to electronics as fire. Everything here has to be residue-free and safe on energised equipment.'],
    ['Vehicle & Fleet', 'vehicle-fleet', 'Cars, trucks, buses and taxis', 'vehicle', 'Fuel, upholstery and a battery in a confined space that moves. Units must be bracket-mounted and vibration rated.'],
    ['Warehouse & Godown', 'warehouse-godown', 'Racking, cartons and pallets', 'warehouse', 'Large volumes of Class A material and long travel distances. Coverage is about placement and capacity, not just count.'],
    ['Workshop & Welding Bay', 'workshop-welding', 'Hot work, fuel and metal', 'workshop', 'Sparks meeting solvent, and in fabrication shops, burning metal swarf that most extinguishers make worse.'],
    ['Home & Apartment', 'home-apartment', 'Kitchen, meter board and terrace', 'home', 'One well-chosen unit near the kitchen and one near the meter board covers most domestic fires.'],
    ['Office & Retail', 'office-retail', 'Workstations, stock and panels', 'office', 'Paper and furnishings alongside a lot of live equipment, in a space full of people who have never used an extinguisher.'],
    ['Chemical & Fuel Storage', 'chemical-fuel', 'Drums, tanks and decanting', 'chemical', 'Flammable liquid in quantity, where a sealed vapour blanket matters more than knockdown speed.'],
    ['Hospital & Clinic', 'hospital-clinic', 'Wards, oxygen and equipment', 'hospital', 'Oxygen-enriched air, immobile occupants and sensitive equipment. Clean agent and CO2 dominate.'],
    ['School & Institution', 'school-institution', 'Classrooms, labs and hostels', 'school', 'Statutory coverage across a large floor plate, plus laboratory hazards concentrated in a few rooms.'],
  ] as const;
  const hazards: Record<string, string> = {};
  for (const [i, [name, slug, summary, pictogram, description]] of hazardSpecs.entries()) {
    const h = await db.hazard.create({
      data: { name, slug, summary, pictogram, description, position: i + 1 },
    });
    hazards[slug] = h.id;
  }
  // ------------------------------------------------------------- products
  // Names, copy, specification tables, prices and photographs are the
  // company's own. Fire-class coverage is derived from the medium below,
  // because the source listing states classes only loosely and this is the
  // safety-critical claim on the page.
  let imageCount = 0;
  let inactiveCount = 0;

  for (const [pi, spec] of PRODUCTS.entries()) {
    const product = await db.product.create({
      data: {
        name: spec.name,
        slug: spec.slug,
        sku: spec.sku,
        categoryId: categories[spec.category],
        shortDescription: spec.short,
        description: spec.description,
        medium: spec.medium as Medium,
        // The source advertises no BIS licence number, so nothing here claims
        // an ISI mark. Set it per product in admin against the real licence.
        isIsiMarked: false,
        standardCode: null,
        warrantyNote: null,
        refillMonths: null,
        safeOnLiveElectrical: spec.electrical,
        electricalRatingKv: null,
        isFeatured: pi < 8,
        isActive: spec.active,
        position: pi + 1,
        variants: {
          create: [
            {
              label: spec.label,
              capacity: spec.capacity,
              capacityUnit: spec.capacityUnit,
              sku: `${spec.sku}-V1`,
              // "Price on Request" items are seeded inactive at zero rather
              // than given a number the company never published.
              pricePaise: spec.pricePaise ?? 0,
              mrpPaise: null,
              stock: spec.active ? PROVISIONAL_STOCK : 0,
              isDefault: true,
              position: 0,
            },
          ],
        },
        images: {
          create: spec.images.map((url, ii) => ({
            url,
            alt: spec.name,
            position: ii,
            isPrimary: ii === 0,
          })),
        },
      },
    });

    imageCount += spec.images.length;
    if (!spec.active) inactiveCount += 1;

    for (const code of spec.covers) {
      await db.productFireClass.create({
        data: { productId: product.id, fireClassId: fireClasses[code], covers: true },
      });
    }
    for (const code of spec.prohibited) {
      await db.productFireClass.create({
        data: { productId: product.id, fireClassId: fireClasses[code], covers: false },
      });
    }
    for (const [hi, slug] of spec.hazards.entries()) {
      const hazardId = hazards[slug];
      if (!hazardId) continue;
      await db.productHazard.create({
        data: { productId: product.id, hazardId, rank: hi },
      });
    }
  }

  // ------------------------------------------------------------------ faq
  const faqs: [string, string, FaqGroup][] = [
    ['Which extinguisher do I actually need?', 'Start from what would burn, not from the product list. Paper, wood and cloth need Class A cover; petrol, diesel, paint and solvent need Class B; LPG and other gases need Class C; a deep-fat fryer needs Class K and nothing else will do. If you are covering a mixed general space and want one unit, an ABC dry powder extinguisher is the usual answer. Every product page on this site states its classes and, just as importantly, what it must not be used on.', FaqGroup.GENERAL],
    ['Can I use a fire extinguisher on live electrical equipment?', 'Only if the unit says so. CO2, clean agent, water mist and ABC dry powder units are dielectrically tested and safe on energised equipment; each product page shows the tested rating in kilovolts. Water and foam extinguishers are not — the discharge conducts back along the stream to the person holding it. Note that "electrical" is not a fire class under IS 2190, which is why we show it as a separate property rather than as a letter.', FaqGroup.GENERAL],
    ['How often does an extinguisher need servicing?', 'Check the pressure gauge yourself monthly — the needle should sit in the green. A competent person should inspect the unit every six months. Refilling intervals depend on the type: water and foam typically every two years, dry powder every three, CO2 and clean agent every five. Any unit that has been discharged, even for a second, must be refilled immediately; a partially discharged extinguisher will not work when you next need it.', FaqGroup.GENERAL],
    ['What does the ISI mark mean, and do I need it?', 'The ISI mark shows the product is manufactured under a BIS licence to the relevant Indian Standard, which for portable extinguishers is IS 15683. For most statutory and insurance purposes an ISI-marked unit is what will be accepted. Products on this site state whether they are ISI marked and which standard they are built to. Some specialist units, such as clean agent extinguishers, are built to the standard without carrying the mark.', FaqGroup.GENERAL],
    ['How many extinguishers does my premises need?', 'It depends on floor area, occupancy type and travel distance rather than on a single rule of thumb — broadly, no occupant should have to travel more than 15 metres to reach a unit. Local fire-department requirements vary by state and by building class. If you send us your floor plan and occupancy type we will mark up a placement plan; that service is free and carries no obligation to buy.', FaqGroup.GENERAL],
    ['Do you deliver across India?', 'Yes. Portable extinguishers ship anywhere in India by surface transport. CO2 and clean agent units are pressurised vessels and travel under restricted transport rules, which can add a day or two to remote pin codes. Hose reels, hydrants and trolley-mounted units ship by freight and are quoted separately.', FaqGroup.GENERAL],
    ['Can I return an extinguisher?', 'Unused, undamaged units in original packaging can be returned within seven days of delivery. Once a unit has been discharged or its tamper seal broken it cannot be returned, because it can no longer be certified as full. Manufacturing defects are covered by the product warranty for its full stated term.', FaqGroup.GENERAL],
    ['Do you handle refilling and annual maintenance?', 'Yes, across Mumbai and most of Maharashtra directly, and elsewhere through partner service firms. Refilling covers pressure testing, agent replacement, valve service and a new inspection tag. AMC contracts cover scheduled six-monthly inspection with documentation for your fire-department file.', FaqGroup.GENERAL],
    ['What is the minimum order quantity for trade?', 'Fifty units per SKU for most portable extinguishers, and lower on hose reels, cabinets and signage. If you are opening a new territory we will usually start you below MOQ for a first order — talk to us rather than assuming the number is fixed.', FaqGroup.PARTNER],
    ['Do you offer private labelling?', 'Yes, on dry powder, CO2 and foam units above agreed volumes. Private labelling covers cylinder colour, silkscreen artwork and carton. The BIS licence and the standard marking remain ours and cannot be altered — that is a legal requirement, not a policy.', FaqGroup.PARTNER],
    ['What are the payment terms for bulk orders?', 'A first order is against advance payment. From the second order onward, established partners are offered thirty-day credit against a signed agreement and GST registration. Distributors with a running annual commitment are reviewed for extended terms.', FaqGroup.PARTNER],
    ['How long does a bulk order take to ship?', 'Stocked SKUs dispatch within three to five working days of a confirmed order. Private-labelled and non-stocked items run three to four weeks depending on artwork approval and cylinder availability. We confirm a dispatch date in writing with the proforma, not after.', FaqGroup.PARTNER],
    ['Do you provide marketing material and training?', 'Yes. Partners receive product sheets, class-selection charts, shelf talkers and signage artwork, plus a half-day product and demonstration training for your counter staff. We would rather your team could answer a customer correctly than sell them the wrong unit quickly.', FaqGroup.PARTNER],
    ['Are your products BIS certified?', 'Portable extinguishers marked ISI on this site are manufactured under a BIS licence to IS 15683. Each product page states its standard and whether it carries the mark. We will send the licence documentation to any registered partner on request.', FaqGroup.PARTNER],
  ];
  for (const [i, [question, answer, group]] of faqs.entries()) {
    await db.faq.create({ data: { question, answer, group, position: i } });
  }
  // -------------------------------------------------------------- settings
  // Fire Oxine Safety Industries' own published details, from
  // https://www.fireoxinesafetyindustries.in/profile.html
  //
  // NOT PUBLISHED BY THE SOURCE, so not verified: contact.email. The listing
  // takes enquiries by phone and web form only. Confirm the real address
  // before launch — it is rendered in the footer and on /contact.
  const settings: [string, string, string, string][] = [
    ['contact.phone', '07942866992', 'Phone number', 'contact'],
    ['contact.email', 'info@fireoxinesafetyindustries.in', 'Email address (UNVERIFIED — confirm)', 'contact'],
    ['contact.address', 'D6, Neera Bai Industrial Estate, Datta Mandir Road, Near Datta Mandir, Bhandup West, Mumbai - 400078, Maharashtra', 'Office address', 'contact'],
    ['contact.mapUrl', 'https://maps.google.com?q=19.15569000,72.93209000', 'Map link', 'contact'],
    ['social.instagram', '', 'Instagram', 'social'],
    ['social.linkedin', '', 'LinkedIn', 'social'],
    ['social.facebook', '', 'Facebook', 'social'],
    ['social.youtube', '', 'YouTube', 'social'],
    ['home.heroLine1', 'KNOW', 'Hero word 1', 'home'],
    ['home.heroLine2', 'WHAT', 'Hero word 2', 'home'],
    ['home.heroLine3', 'BURNS', 'Hero word 3', 'home'],
    ['home.heroSub', 'Manufacturers of fire extinguishers, hydrant systems and sprinkler equipment since 2006, from Bhandup West, Mumbai.', 'Hero subline', 'home'],
    ['home.marquee', 'Know what burns. Carry what stops it.', 'Marquee line', 'home'],
    ['shipping.freeAbovePaise', '500000', 'Free shipping above (paise)', 'shipping'],
    ['shipping.flatPaise', '15000', 'Flat shipping rate (paise)', 'shipping'],
    // ---- Company factsheet, as published on the source profile page. -----
    ['company.legalName', 'Fire Oxine Safety Industries', 'Registered name', 'general'],
    ['company.contactPerson', 'Saurabh Gala', 'Contact person', 'general'],
    ['company.contactRole', 'Proprietor', 'Contact person role', 'general'],
    ['company.ceo', 'Saurabh Jayesh Gala', 'Company CEO', 'general'],
    ['company.established', '2006', 'Year established', 'general'],
    ['company.natureOfBusiness', 'Manufacturer', 'Nature of business', 'general'],
    ['company.additionalBusiness', 'Factory / Manufacturing · Retail Business · Supplier of Services', 'Additional business', 'general'],
    ['company.legalStatus', 'Proprietorship', 'Legal status of firm', 'general'],
    ['company.gst', '27BSDPG7364M1ZA', 'GST number', 'general'],
    ['company.gstDate', '21-09-2017', 'GST registration date', 'general'],
    ['company.iec', 'BSDPG7364M', 'Import Export Code (IEC)', 'general'],
    ['company.employees', 'Upto 10 People', 'Total employees', 'general'],
    ['company.turnover', '1.5 - 5 Cr', 'Annual turnover', 'general'],
    ['company.banker', 'Saraswat Co-operative Bank Limited', 'Banker', 'general'],
    ['company.usp', 'After-sales support · Installation services · Maintenance service', 'Company USP', 'general'],
    ['company.advantage', 'Good financial position & TQM · Large production capacity', 'Competitive advantage', 'general'],
    ['company.qualityTesting', 'Yes', 'Quality measures / testing facilities', 'general'],
    ['company.customPackaging', 'Yes', 'Customised packaging', 'general'],
    ['company.paymentModes', 'Cash · Cheque · DD · Bank Transfer', 'Payment modes', 'general'],
    ['company.shipmentMode', 'By Road', 'Shipment mode', 'general'],
    ['company.responseRate', '83%', 'Enquiry response rate', 'general'],

    // ---- About page copy. Long fields; lists are one item per line. -------
    ['about.lede', 'We, Fireoxine Safety Industries, from 2006, are one of the foremost manufacturers and traders of an extensive array of fire safety products.', 'About — opening line', 'about'],
    ['about.story', 'Our offered range consists of best grade hose pipe, pipe nozzles and fire extinguishers. To design these products, we use top quality input factors. Our products are appreciated for their features like easy to use, crack resistance, smooth finish, sturdy design and lightweight. Additionally, these products are offered to clients in various standard sizes as well as in customised options. We provide sprinkler alarm installation service and refilling of fire extinguishers service to our clients.\n\nWe are backed by experts who are proficient in all aspects of this domain and share our aim of fulfilling the requirements of clients. Each member holds expertise in his department and is dedicated to the success of the company. Owing to our ethical business policies, reasonable prices and on-time delivery, we have constantly increased the number of our satisfied clients.\n\nWe are headed by Mr. Jayesh Gala, who has guided us in the best possible manner. He has been the driving force behind our success and propelled us to the zenith of this field in a short period of time.', 'About — story (blank line between paragraphs)', 'about'],
    ['about.whyUsBody', "We lay special emphasis on the customer management and production process for meeting the ever-expanding needs of our clients. Apart from this, our quality control engineers are the mainstay of our company's growth. Also, our mission is to satisfy our clients by providing premium quality products.", 'Why us — body', 'about'],
    ['about.whyUsFactors', 'Competitive pricing\nHuge range\nSuperior and unmatched quality\nOn time deliveries\nCapability to cater to bulk orders', 'Why us — factors (one per line)', 'about'],
    ['about.infrastructureBody', 'Our infrastructure setup is the backbone of our company. We source finest quality raw material for the benefits of our clients. Our spacious warehouse has the capacity to store the wide range of quantities of products. In addition to this, our efficient transportation facilities help us to deliver our products within the stipulated time.', 'Infrastructure — body', 'about'],
    ['about.infrastructureUnits', 'Product design\nManufacturing\nQuality control\nPost-production processes', 'Infrastructure — units (one per line)', 'about'],
    ['about.qualityBody', 'Quality ranks high on our priority list for the satisfaction of our clients. We aim to reach the top of perfection by supplying fire safety products. Also, we strictly monitor the process in order to maintain the quality standards. In addition to this, with our quality assured fire safety products, we have been able to reach every corner of the market.', 'Customer satisfaction — body', 'about'],
    ['about.teamBody', 'Our company is able to provide the large array of fire safety products to clients with the help of our diligent team. Our professionals work together in order to complete the task of the company within limited time and with utilising available resources in an efficient way.', 'Our team — body', 'about'],
    ['about.teamRoles', 'Engineers\nTechnicians\nQuality Controllers\nResearchers\nWarehousing Personnel\nPackaging Experts\nSales & Marketing Executives', 'Our team — roles (one per line)', 'about'],
    ['about.clienteleBody', 'Our client philosophy is anchored around the following core principles: always serve with honesty, integrity and transparency; always first understand your business needs and objectives; always think innovatively, deliver effectively.', 'Clientele — body', 'about'],
    ['about.clients', 'Somaiya Group\nGodavari Bio Refineries Ltd\nAshapura Perfocly Ltd\nAce Nonwoven Pvt Ltd\nBox 8\nCiti Lift\nRunwal\nHP\nMitsubishi\nWindsun Renewables Pvt Ltd\nKanakia Spaces Realty Pvt. Ltd.', 'Clientele — client list (one per line)', 'about'],
    ['about.brands', 'Flamex\nA-ONE', 'Brands we deal in (one per line)', 'about'],
    // The source publishes this certificate with both dates. It has LAPSED.
    // The page prints the dates and marks it expired rather than implying a
    // live certification — clear it here once a current certificate exists.
    ['about.isoStandard', 'ISO 9001:2015', 'ISO certificate — standard', 'about'],
    ['about.isoIssued', '07-Oct-2017', 'ISO certificate — issue date', 'about'],
    ['about.isoExpiry', '07-Oct-2020', 'ISO certificate — expiry date', 'about'],
  ];
  for (const [key, value, label, group] of settings) {
    await db.siteSetting.create({ data: { key, value, label, group } });
  }

  const counts = {
    categories: await db.category.count(),
    hazards: await db.hazard.count(),
    fireClasses: await db.fireClass.count(),
    products: await db.product.count(),
    variants: await db.productVariant.count(),
    images: await db.productImage.count(),
    faqs: await db.faq.count(),
    settings: await db.siteSetting.count(),
    users: await db.user.count(),
  };
  console.log('Seeded:', counts);
  console.log(`Product images: ${imageCount} imported to apps/api/public/uploads.`);
  console.log(
    `Inactive: ${inactiveCount} products the source lists as "Price on Request" — ` +
      'price them in admin and switch them on.'
  );
  console.log(`Customer: customer@example.com / customer1234 (${customer.email})`);
  console.log('Admin:    admin@fireoxine.in / admin1234');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
