/**
 * FireOxine catalogue seed.
 *
 * IMPORTANT — what is real and what is not:
 *
 *   REAL: every fire-class definition, extinguishing medium, class/medium
 *   pairing, electrical-safety flag and IS standard code below is accurate
 *   domain fact, checked against IS 2190 and IS 15683 conventions. These are
 *   the facts the site's safety claims rest on, so they are not invented.
 *
 *   ILLUSTRATIVE: product names, SKUs, prices, stock levels and the company's
 *   phone/email/address are placeholder content authored for this build. They
 *   must be replaced with the client's real catalogue before launch. No
 *   certification licence number is invented anywhere — `isIsiMarked` records
 *   only that a unit is sold as ISI-marked; the licence number field is left
 *   for the client to fill in from their actual licence.
 *
 *   ABSENT: product photography. Every product seeds with zero images on
 *   purpose, so the pending-image state is what you see until the client
 *   uploads through /admin. That is the real launch condition, and the design
 *   is built to hold it.
 */
import { PrismaClient, Medium, Role, FaqGroup } from '@prisma/client';
import bcrypt from 'bcryptjs';

const db = new PrismaClient();

const rupees = (n: number) => Math.round(n * 100);

async function main() {
  // Order matters: children before parents.
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
  const categorySpecs = [
    ['ABC Dry Powder Extinguishers', 'abc-dry-powder', 'The general-purpose unit', 'Mono-ammonium phosphate powder rated for solids, liquids and gases, and safe on live electrical equipment. If a premises buys one extinguisher, it is usually this one.'],
    ['CO2 Extinguishers', 'co2', 'Clean, residue-free', 'Carbon dioxide displaces oxygen and leaves nothing behind, which is why it lives beside switchgear, servers and laboratory benches.'],
    ['Mechanical Foam Extinguishers', 'mechanical-foam', 'For liquids that spread', 'AFFF foam blankets a flammable liquid and seals the vapour, stopping the reignition that catches people out with powder.'],
    ['Water & Water Mist Extinguishers', 'water-and-mist', 'For ordinary combustibles', 'The cheapest and most effective answer to burning wood, paper and cloth. Mist units add a de-ionised spray that is safe near electrical equipment.'],
    ['Clean Agent Extinguishers', 'clean-agent', 'Where residue is unacceptable', 'HFC-236fa and FK-5-1-12 agents leave no powder, no film and no corrosion — the choice for server racks, archives and control rooms.'],
    ['Wet Chemical (K Class) Extinguishers', 'wet-chemical', 'Commercial kitchens', 'A potassium salt solution that saponifies burning oil into a soapy crust. The only correct answer to a fryer fire.'],
    ['Automatic Modular Extinguishers', 'automatic-modular', 'Unmanned protection', 'Ceiling-mounted units that discharge on their own at a set temperature, for panel rooms, lift machine rooms and stores nobody is watching.'],
    ['Fire Hose Reels & Hydrants', 'hose-reels-hydrants', 'Fixed installations', 'Swinging hose reels, landing valves, branch pipes and couplings for buildings with a wet riser.'],
    ['Fire Detection & Alarm', 'detection-alarm', 'Warning before flame', 'Smoke and heat detectors, manual call points, hooters and panels — the half of fire safety that buys people time.'],
    ['Fire Safety Signage', 'signage', 'Statutory marking', 'Photoluminescent exit, equipment and prohibition signage to IS 9457, so a dark corridor still reads.'],
    ['Fire Blankets & Safety Gear', 'blankets-gear', 'First response', 'Blankets, gloves, helmets and fire-retardant clothing for the person who reaches the fire first.'],
    ['Cabinets, Stands & Accessories', 'cabinets-accessories', 'Mounting and storage', 'Powder-coated cabinets, floor stands, vehicle brackets and wall hooks that keep a unit where the inspection expects it.'],
  ] as const;
  const categories: Record<string, string> = {};
  for (const [i, [name, slug, tagline, description]] of categorySpecs.entries()) {
    const c = await db.category.create({
      data: { name, slug, tagline, description, position: i + 1 },
    });
    categories[slug] = c.id;
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
  type Spec = {
    name: string;
    slug: string;
    sku: string;
    category: string;
    medium: Medium;
    short: string;
    description: string;
    covers: string[];
    prohibited: string[];
    electrical: boolean;
    kv?: number;
    isi?: boolean;
    standard?: string;
    refill?: number;
    warranty?: string;
    featured?: boolean;
    hazards: string[];
    variants: [string, number, string, number, number | null, number][];
  };

  const products: Spec[] = [
    {
      name: 'Sentinel ABC Dry Powder Extinguisher',
      slug: 'sentinel-abc-dry-powder',
      sku: 'FX-ABC-STD',
      category: 'abc-dry-powder',
      medium: Medium.ABC_POWDER,
      short: 'The one unit that covers almost everything a premises can burn.',
      description:
        'Mono-ammonium phosphate powder at 90% concentration, stored-pressure, with a squeeze-grip discharge and a pressure gauge you can read at a glance. Rated for ordinary combustibles, flammable liquids and gases, and tested safe on live electrical equipment up to 1000 volts. The powder melts and forms a crust over Class A material, which is what stops a smouldering fire from re-establishing itself after you walk away.\n\nMounted with the supplied wall bracket, discharged in a sweeping motion at the base of the fire. Requires pressure checking every six months and refilling every three years, or immediately after any discharge, however brief.',
      covers: ['A', 'B', 'C'],
      prohibited: ['D', 'K'],
      electrical: true,
      kv: 1,
      isi: true,
      standard: 'IS 15683',
      refill: 36,
      warranty: '5 year manufacturer warranty against manufacturing defect. Warranty does not cover a discharged or overdue unit.',
      featured: true,
      hazards: ['warehouse-godown', 'office-retail', 'home-apartment', 'school-institution', 'workshop-welding'],
      variants: [
        ['1 kg', 1, 'kg', rupees(845), rupees(1050), 140],
        ['2 kg', 2, 'kg', rupees(1180), rupees(1450), 96],
        ['4 kg', 4, 'kg', rupees(1690), rupees(2100), 72],
        ['6 kg', 6, 'kg', rupees(2340), rupees(2900), 48],
        ['9 kg', 9, 'kg', rupees(3280), null, 22],
      ],
    },
    {
      name: 'Sentinel ABC Powder Extinguisher — Vehicle Mount',
      slug: 'sentinel-abc-vehicle-mount',
      sku: 'FX-ABC-VEH',
      category: 'abc-dry-powder',
      medium: Medium.ABC_POWDER,
      short: 'Vibration-rated ABC unit with a quick-release vehicle bracket.',
      description:
        'The same 90% MAP powder charge as the standard Sentinel, in a shorter body with a steel quick-release bracket rated for continuous vehicle vibration. Sized to sit under a driver seat or inside a boot well without fouling the seat rails.\n\nCommercial vehicles in most Indian states are required to carry a serviceable extinguisher. A unit rolling loose in the boot does not satisfy that requirement and will not be reachable in the seconds you have.',
      covers: ['A', 'B', 'C'],
      prohibited: ['D', 'K'],
      electrical: true,
      kv: 1,
      isi: true,
      standard: 'IS 15683',
      refill: 36,
      hazards: ['vehicle-fleet'],
      variants: [
        ['500 g', 0.5, 'kg', rupees(590), rupees(720), 210],
        ['1 kg', 1, 'kg', rupees(920), rupees(1120), 165],
        ['2 kg', 2, 'kg', rupees(1290), null, 88],
      ],
    },
    {
      name: 'Aegis CO2 Extinguisher',
      slug: 'aegis-co2',
      sku: 'FX-CO2-STD',
      category: 'co2',
      medium: Medium.CO2,
      short: 'Residue-free knockdown for live electrical equipment.',
      description:
        'Liquefied carbon dioxide in a high-pressure seamless cylinder with a frost-free discharge horn. CO2 smothers a fire by displacing oxygen and cooling the fuel, then disperses completely — no powder to clean out of a rack, no film on a circuit board, no corrosion.\n\nThe horn is not insulated on cheap units; ours is, because bare metal at discharge temperature will freeze to skin. Use in a confined space carries an asphyxiation risk: ventilate and leave the room after use.',
      covers: ['B'],
      prohibited: ['D', 'K'],
      electrical: true,
      kv: 35,
      isi: true,
      standard: 'IS 15683',
      refill: 60,
      warranty: '5 year warranty on the cylinder, 1 year on the valve assembly.',
      featured: true,
      hazards: ['server-room', 'office-retail', 'hospital-clinic', 'workshop-welding'],
      variants: [
        ['2 kg', 2, 'kg', rupees(3450), rupees(4200), 54],
        ['3 kg', 3, 'kg', rupees(4680), rupees(5600), 40],
        ['4.5 kg', 4.5, 'kg', rupees(6250), null, 26],
        ['6.5 kg', 6.5, 'kg', rupees(8900), null, 14],
      ],
    },
    {
      name: 'Aegis Mechanical Foam AFFF Extinguisher',
      slug: 'aegis-mechanical-foam-afff',
      sku: 'FX-FOAM-STD',
      category: 'mechanical-foam',
      medium: Medium.MECHANICAL_FOAM,
      short: 'Seals the vapour on a liquid fire so it cannot reignite.',
      description:
        'Aqueous film-forming foam concentrate, stored-pressure, with an aspirating branch pipe. On a flammable liquid the foam floats and spreads into a continuous film that cuts the fuel off from air — the reignition that catches people out after a powder discharge simply does not happen.\n\nAlso effective on Class A material, which makes it a sensible single choice for a fuel store or a paint godown. Not safe on live electrical equipment: the foam is water-based and conducts.',
      covers: ['A', 'B'],
      prohibited: ['C', 'D', 'K'],
      electrical: false,
      isi: true,
      standard: 'IS 15683',
      refill: 24,
      hazards: ['chemical-fuel', 'warehouse-godown', 'workshop-welding', 'vehicle-fleet'],
      variants: [
        ['6 litre', 6, 'litre', rupees(2450), rupees(2980), 62],
        ['9 litre', 9, 'litre', rupees(3180), rupees(3800), 38],
        ['50 litre trolley', 50, 'litre', rupees(18400), null, 6],
      ],
    },
    {
      name: 'Aegis Water Mist Extinguisher',
      slug: 'aegis-water-mist',
      sku: 'FX-MIST-STD',
      category: 'water-and-mist',
      medium: Medium.WATER_MIST,
      short: 'De-ionised mist — the water unit you can use near electronics.',
      description:
        'De-ionised water driven through a fine-spray nozzle that atomises the stream into a mist. The droplets carry so little charge, and present so much surface area, that the unit is dielectrically tested safe near energised equipment while still cooling a Class A fire the way only water can.\n\nThe same mist is effective on cooking media, which makes this a rare unit that spans an office and a small kitchen. Leaves no residue beyond water.',
      covers: ['A', 'K'],
      prohibited: ['B', 'C', 'D'],
      electrical: true,
      kv: 35,
      isi: false,
      standard: 'IS 15683',
      refill: 24,
      featured: true,
      hazards: ['office-retail', 'hospital-clinic', 'school-institution', 'home-apartment'],
      variants: [
        ['3 litre', 3, 'litre', rupees(4200), rupees(5100), 44],
        ['6 litre', 6, 'litre', rupees(5850), null, 28],
        ['9 litre', 9, 'litre', rupees(7400), null, 16],
      ],
    },
    {
      name: 'Aegis Stored-Pressure Water Extinguisher',
      slug: 'aegis-water',
      sku: 'FX-WTR-STD',
      category: 'water-and-mist',
      medium: Medium.WATER,
      short: 'The cheapest correct answer to burning paper, wood and cloth.',
      description:
        'A plain water charge under stored nitrogen pressure, with a jet nozzle. For Class A material nothing beats water on cost per litre or on cooling — it removes heat rather than merely interrupting the flame, so the fire cannot re-establish.\n\nNever use on flammable liquids, where the jet will spread the burning fuel, or on live electrical equipment, where the stream conducts back to the operator.',
      covers: ['A'],
      prohibited: ['B', 'C', 'D', 'K'],
      electrical: false,
      isi: true,
      standard: 'IS 15683',
      refill: 24,
      hazards: ['warehouse-godown', 'school-institution', 'office-retail'],
      variants: [
        ['9 litre', 9, 'litre', rupees(1980), rupees(2400), 74],
        ['50 litre trolley', 50, 'litre', rupees(14200), null, 8],
      ],
    },
    {
      name: 'Vantage Clean Agent Extinguisher',
      slug: 'vantage-clean-agent',
      sku: 'FX-CLN-STD',
      category: 'clean-agent',
      medium: Medium.CLEAN_AGENT,
      short: 'Zero residue, zero corrosion, safe on energised racks.',
      description:
        'HFC-236fa clean agent, electrically non-conductive and non-corrosive, which vaporises completely on discharge and leaves nothing to clean up. It interrupts the combustion reaction chemically rather than by smothering, so it works fast in an enclosure without displacing enough oxygen to be immediately dangerous to a person leaving the room.\n\nThe correct unit where the contents are worth more than the cylinder: server racks, archives, control rooms, switch rooms and laboratory instruments.',
      covers: ['A', 'B', 'C'],
      prohibited: ['D', 'K'],
      electrical: true,
      kv: 35,
      isi: false,
      standard: 'IS 15683',
      refill: 60,
      warranty: '5 year warranty. Agent is recoverable at service, not vented.',
      featured: true,
      hazards: ['server-room', 'hospital-clinic', 'office-retail'],
      variants: [
        ['2 kg', 2, 'kg', rupees(5900), rupees(7100), 34],
        ['4 kg', 4, 'kg', rupees(9800), rupees(11500), 20],
        ['6 kg', 6, 'kg', rupees(13600), null, 11],
      ],
    },
    {
      name: 'Culina Wet Chemical K-Class Extinguisher',
      slug: 'culina-wet-chemical',
      sku: 'FX-WET-STD',
      category: 'wet-chemical',
      medium: Medium.WET_CHEMICAL,
      short: 'The only correct extinguisher for a deep-fat fryer.',
      description:
        'A potassium acetate solution discharged as a low-velocity soft spray through a long applicator lance. On burning oil it saponifies — chemically converting the surface of the fat into a soap crust that seals the vapour and holds the temperature down while the oil below cools past its auto-ignition point.\n\nThe soft spray matters as much as the chemistry: a jet would splash burning oil out of the vessel. Nothing else on this site should be used on a fryer, and a water or powder unit aimed into hot oil will produce a fireball.',
      covers: ['A', 'K'],
      prohibited: ['B', 'C', 'D'],
      electrical: false,
      isi: false,
      standard: 'IS 15683',
      refill: 24,
      warranty: 'Includes applicator lance and wall bracket.',
      featured: true,
      hazards: ['commercial-kitchen', 'school-institution', 'hospital-clinic'],
      variants: [
        ['3 litre', 3, 'litre', rupees(4950), rupees(5900), 40],
        ['6 litre', 6, 'litre', rupees(6800), rupees(7900), 26],
      ],
    },
    {
      name: 'Guardian Class D Metal Fire Extinguisher',
      slug: 'guardian-class-d',
      sku: 'FX-DCL-STD',
      category: 'abc-dry-powder',
      medium: Medium.D_CLASS_POWDER,
      short: 'Ternary eutectic chloride for burning metal — nothing else works.',
      description:
        'A dedicated Class D powder applied through a low-pressure applicator wand. Burning metals are hot enough to strip oxygen out of water and out of ordinary dry powder, which is why a standard extinguisher aimed at magnesium swarf produces an explosion rather than a knockdown.\n\nThe agent is applied as a gentle blanket, never a jet, to avoid scattering burning metal. Required wherever magnesium, sodium, potassium, titanium or fine aluminium swarf is machined or stored.',
      covers: ['D'],
      prohibited: ['A', 'B', 'C', 'K'],
      electrical: false,
      isi: false,
      standard: 'IS 15683',
      refill: 36,
      hazards: ['workshop-welding', 'chemical-fuel'],
      variants: [
        ['9 kg', 9, 'kg', rupees(12400), null, 9],
        ['12 kg', 12, 'kg', rupees(16200), null, 5],
      ],
    },
    {
      name: 'Sentinel Automatic Modular Extinguisher',
      slug: 'sentinel-automatic-modular',
      sku: 'FX-AMD-STD',
      category: 'automatic-modular',
      medium: Medium.ABC_POWDER,
      short: 'Ceiling-mounted, discharges itself at 68 °C. No one has to be there.',
      description:
        'A sealed ABC powder module with a glass-bulb thermal trigger, mounted directly above the risk. The bulb bursts at 68 °C and the charge discharges over the area below without any electrical supply, panel or human intervention.\n\nDesigned for the spaces where a fire starts unobserved and does the most damage before anyone notices: electrical panel rooms, lift machine rooms, generator enclosures, server cabinets and locked stores.',
      covers: ['A', 'B', 'C'],
      prohibited: ['D', 'K'],
      electrical: true,
      kv: 1,
      isi: false,
      standard: 'IS 15683',
      refill: 36,
      hazards: ['server-room', 'warehouse-godown', 'workshop-welding'],
      variants: [
        ['5 kg', 5, 'kg', rupees(4600), rupees(5400), 30],
        ['10 kg', 10, 'kg', rupees(7900), null, 18],
      ],
    },
    {
      name: 'FireOxine Fire Blanket',
      slug: 'fireoxine-fire-blanket',
      sku: 'FX-BLK-STD',
      category: 'blankets-gear',
      medium: Medium.NOT_APPLICABLE,
      short: 'Woven glass fibre in a quick-pull pouch. For a pan, or a person.',
      description:
        'Woven glass fibre cloth in a wall-mounted pouch with two pull tabs. Laid over a burning pan it cuts off air immediately, with no residue, no splash and no chance of spreading burning oil. It is also the fastest way to smother clothing that has caught fire.\n\nMounted beside a hob rather than above it — you should never have to reach across a fire to get to it. Single use: discard after any deployment.',
      covers: ['A', 'K'],
      prohibited: [],
      electrical: false,
      isi: false,
      refill: undefined,
      hazards: ['commercial-kitchen', 'home-apartment', 'school-institution'],
      variants: [
        ['1.0 × 1.0 m', 1, 'm', rupees(690), rupees(890), 180],
        ['1.2 × 1.2 m', 1.2, 'm', rupees(940), rupees(1150), 120],
        ['1.8 × 1.8 m', 1.8, 'm', rupees(1560), null, 64],
      ],
    },
    {
      name: 'FireOxine First-Aid Hose Reel',
      slug: 'fireoxine-hose-reel',
      sku: 'FX-HSR-STD',
      category: 'hose-reels-hydrants',
      medium: Medium.WATER,
      short: 'Swinging-arm reel with 36 m of thermoplastic hose.',
      description:
        'A wall or recess-mounted swinging-arm reel carrying 36 metres of 19 mm thermoplastic hose on a shut-off nozzle, fed from the building wet riser. Unlike a portable unit it does not run out — for a developing Class A fire in a large floor plate that is the difference that matters.\n\nSupplied with drum, arm, inlet valve and nozzle. Installation against the riser is not included and should be carried out by your building contractor.',
      covers: ['A'],
      prohibited: ['B', 'C', 'D', 'K'],
      electrical: false,
      isi: true,
      standard: 'IS 884',
      hazards: ['warehouse-godown', 'office-retail', 'school-institution', 'hospital-clinic'],
      variants: [
        ['19 mm × 36 m', 36, 'm', rupees(11800), rupees(13500), 16],
        ['25 mm × 36 m', 36, 'm', rupees(14200), null, 9],
      ],
    },
    {
      name: 'FireOxine Optical Smoke Detector',
      slug: 'fireoxine-smoke-detector',
      sku: 'FX-DET-SMK',
      category: 'detection-alarm',
      medium: Medium.NOT_APPLICABLE,
      short: 'Photoelectric detection for the smouldering fires that kill.',
      description:
        'A photoelectric chamber that senses scattered light from smoke particles, which makes it markedly better than an ionisation head at catching slow, smouldering fires — the ones that fill a corridor with smoke while everyone is asleep.\n\nAddressable two-wire loop version for panel systems, or a standalone battery unit for a flat. Both carry a test button and a low-battery chirp.',
      covers: [],
      prohibited: [],
      electrical: false,
      isi: false,
      standard: 'IS 2189',
      hazards: ['home-apartment', 'office-retail', 'hospital-clinic', 'school-institution', 'warehouse-godown'],
      variants: [
        ['Standalone battery', 1, 'unit', rupees(1450), rupees(1750), 220],
        ['Addressable loop', 1, 'unit', rupees(2380), null, 130],
      ],
    },
    {
      name: 'FireOxine Photoluminescent Signage Set',
      slug: 'fireoxine-signage-set',
      sku: 'FX-SGN-SET',
      category: 'signage',
      medium: Medium.NOT_APPLICABLE,
      short: 'Exit, equipment and prohibition signs that still read in the dark.',
      description:
        'Rigid photoluminescent panels to IS 9457, charged by ambient light and legible for hours after a power failure. The set covers the statutory minimum for a small commercial premises: directional exit arrows, final exit, fire extinguisher location, hose reel location, assembly point, and the do-not-use-lift prohibition.\n\nSignage is the cheapest item on this site and the one an inspection will fail you for first.',
      covers: [],
      prohibited: [],
      electrical: false,
      isi: false,
      standard: 'IS 9457',
      hazards: ['office-retail', 'school-institution', 'warehouse-godown', 'hospital-clinic'],
      variants: [
        ['8-sign starter set', 8, 'signs', rupees(1180), rupees(1450), 96],
        ['16-sign floor set', 16, 'signs', rupees(2160), null, 58],
      ],
    },
    {
      name: 'FireOxine Extinguisher Cabinet',
      slug: 'fireoxine-extinguisher-cabinet',
      sku: 'FX-CAB-STD',
      category: 'cabinets-accessories',
      medium: Medium.NOT_APPLICABLE,
      short: 'Powder-coated steel with a break-glass front.',
      description:
        'A 1.6 mm powder-coated mild steel cabinet with a toughened break-glass front panel, stencilled lettering and a keyed release. Keeps a unit clean, visible and where the drawing says it is, which is what an inspection is actually checking.\n\nSurface-mount and recessed variants. Specify by the largest unit it must hold, not by the unit you own today.',
      covers: [],
      prohibited: [],
      electrical: false,
      isi: false,
      hazards: ['office-retail', 'warehouse-godown', 'hospital-clinic', 'school-institution'],
      variants: [
        ['Single, up to 6 kg', 6, 'kg', rupees(3400), rupees(4100), 42],
        ['Single, up to 9 kg', 9, 'kg', rupees(4250), null, 30],
        ['Double, up to 9 kg', 9, 'kg', rupees(6800), null, 15],
      ],
    },
  ];

  for (const [pi, spec] of products.entries()) {
    const product = await db.product.create({
      data: {
        name: spec.name,
        slug: spec.slug,
        sku: spec.sku,
        categoryId: categories[spec.category],
        shortDescription: spec.short,
        description: spec.description,
        medium: spec.medium,
        isIsiMarked: spec.isi ?? false,
        standardCode: spec.standard ?? null,
        warrantyNote: spec.warranty ?? null,
        refillMonths: spec.refill ?? null,
        safeOnLiveElectrical: spec.electrical,
        electricalRatingKv: spec.kv ?? null,
        isFeatured: spec.featured ?? false,
        position: pi + 1,
        variants: {
          create: spec.variants.map(([label, capacity, unit, price, mrp, stock], vi) => ({
            label,
            capacity,
            capacityUnit: unit,
            sku: `${spec.sku}-${String(label).replace(/[^0-9A-Za-z]+/g, '').toUpperCase()}`,
            pricePaise: price,
            mrpPaise: mrp,
            stock,
            isDefault: vi === 0,
            position: vi,
          })),
        },
      },
    });

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
      await db.productHazard.create({
        data: { productId: product.id, hazardId: hazards[slug], rank: hi },
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
  // Placeholder contact details. Replace before launch.
  const settings: [string, string, string, string][] = [
    ['contact.phone', '9820000000', 'Phone number', 'contact'],
    ['contact.email', 'hello@fireoxine.in', 'Email address', 'contact'],
    ['contact.address', 'Unit 14, Shreeji Industrial Estate, Andheri East, Mumbai - 400059', 'Office address', 'contact'],
    ['contact.mapUrl', 'https://maps.google.com/?q=Andheri+East+Mumbai', 'Map link', 'contact'],
    ['social.instagram', 'https://instagram.com/fireoxine', 'Instagram', 'social'],
    ['social.linkedin', 'https://linkedin.com/company/fireoxine', 'LinkedIn', 'social'],
    ['social.facebook', 'https://facebook.com/fireoxine', 'Facebook', 'social'],
    ['social.youtube', 'https://youtube.com/@fireoxine', 'YouTube', 'social'],
    ['home.heroLine1', 'KNOW', 'Hero word 1', 'home'],
    ['home.heroLine2', 'WHAT', 'Hero word 2', 'home'],
    ['home.heroLine3', 'BURNS', 'Hero word 3', 'home'],
    ['home.heroSub', 'Certified fire extinguishers, chosen by what is actually at risk.', 'Hero subline', 'home'],
    ['home.marquee', 'Know what burns. Carry what stops it.', 'Marquee line', 'home'],
    ['shipping.freeAbovePaise', '500000', 'Free shipping above (paise)', 'shipping'],
    ['shipping.flatPaise', '15000', 'Flat shipping rate (paise)', 'shipping'],
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
  console.log('Product images seeded: 0 — intentional. Upload via /admin.');
  console.log(`Customer: customer@example.com / customer1234 (${customer.email})`);
  console.log('Admin:    admin@fireoxine.in / admin1234');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
