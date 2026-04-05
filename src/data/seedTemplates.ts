import { WorkoutTemplate } from '../types';

/**
 * Seed templates loaded on first run (when forge_templates is absent from
 * localStorage). These are exported directly from the author's local instance.
 */
export const SEED_TEMPLATES: WorkoutTemplate[] = [
  {
    "id": "5v3q8ih1s",
    "name": "Push",
    "exercises": [
      {
        "id": "sa9vnnjsd",
        "exerciseId": "iso-lateral-shoulder-press",
        "exerciseName": "Iso-Lateral Shoulder Press",
        "category": "shoulders",
        "sets": [
          { "id": "p7xx4xe10", "weight": 50, "reps": 7, "restSeconds": 90 },
          { "id": "hug9zz8ap", "weight": 50, "reps": 5, "restSeconds": 90 },
          { "id": "07z20ixal", "weight": 50, "reps": 3, "restSeconds": 90 }
        ]
      },
      {
        "id": "8bahbu2x8",
        "exerciseId": "iso-lateral-decline-press",
        "exerciseName": "Iso-Lateral Decline Press",
        "category": "chest",
        "sets": [
          { "id": "k5dzycivu", "weight": 50, "reps": 9, "restSeconds": 90 },
          { "id": "y62yvemcb", "weight": 50, "reps": 5, "restSeconds": 90 },
          { "id": "mlpprz2nb", "weight": 50, "reps": 5, "restSeconds": 90 }
        ]
      },
      {
        "id": "n6w7so93i",
        "exerciseId": "chest-dip-assisted",
        "exerciseName": "Chest Dip (Assisted)",
        "category": "arms",
        "sets": [
          { "id": "ze1kat7pp", "weight": 95, "reps": 6, "restSeconds": 90 },
          { "id": "wpnmav7ws", "weight": 95, "reps": 6, "restSeconds": 90 },
          { "id": "6cox4w7ix", "weight": 95, "reps": 4, "restSeconds": 90 }
        ]
      },
      {
        "id": "awhwqc86m",
        "exerciseId": "lateral-raise-cable",
        "exerciseName": "Lateral Raise (Cable)",
        "category": "shoulders",
        "sets": [
          { "id": "vsbt1rurp", "weight": 10, "reps": 7, "restSeconds": 90 },
          { "id": "ytwon8bkg", "weight": 10, "reps": 5, "restSeconds": 90 },
          { "id": "7z1wd7osj", "weight": 10, "reps": 4, "restSeconds": 90 }
        ]
      },
      {
        "id": "outmvknlu",
        "exerciseId": "triceps-extension-dumbbell",
        "exerciseName": "Triceps Extension (Dumbbell)",
        "category": "arms",
        "sets": [
          { "id": "fpauwe3j4", "weight": 17.5, "reps": 19, "restSeconds": 90 },
          { "id": "4sgs0ta3r", "weight": 20, "reps": 9, "restSeconds": 90 },
          { "id": "3jmenyzfv", "weight": 20, "reps": 6, "restSeconds": 90 }
        ]
      }
    ]
  },
  {
    "id": "x1g8myc7n",
    "name": "Leg Day",
    "exercises": [
      {
        "id": "6o5lv4vp7",
        "exerciseId": "calf-press-on-seated-leg-press",
        "exerciseName": "Calf Press on Seated Leg Press",
        "category": "legs",
        "sets": [
          { "id": "rhqohzcbc", "weight": 130, "reps": 15, "restSeconds": 90 },
          { "id": "6uevcy2mw", "weight": 220, "reps": 11, "restSeconds": 90 },
          { "id": "t7sdy6kfj", "weight": 220, "reps": 9, "restSeconds": 90 },
          { "id": "c0hytsgza", "weight": 225, "reps": 8, "restSeconds": 90 }
        ]
      },
      {
        "id": "ewk1nyxeh",
        "exerciseId": "squat-press",
        "exerciseName": "Squat Press",
        "category": "legs",
        "sets": [
          { "id": "c3ea6m78p", "weight": 320, "reps": 9, "restSeconds": 90 },
          { "id": "re39evix7", "weight": 320, "reps": 7, "restSeconds": 90 },
          { "id": "8ybfh2psx", "weight": 320, "reps": 7, "restSeconds": 90 }
        ]
      },
      {
        "id": "po8kjfa16",
        "exerciseId": "leg-extension-machine",
        "exerciseName": "Leg Extension (Machine)",
        "category": "legs",
        "sets": [
          { "id": "5nn5b3rpi", "weight": 135, "reps": 11, "restSeconds": 90 },
          { "id": "kfh5w493v", "weight": 140, "reps": 11, "restSeconds": 90 },
          { "id": "x1ly6ncoj", "weight": 145, "reps": 7, "restSeconds": 90 }
        ]
      },
      {
        "id": "8lxq2ragw",
        "exerciseId": "hip-abductor-machine",
        "exerciseName": "Hip Abductor (Machine)",
        "category": "legs",
        "sets": [
          { "id": "ujjlc58jg", "weight": 210, "reps": 9, "restSeconds": 90 },
          { "id": "diki1i0wp", "weight": 210, "reps": 8, "restSeconds": 90 },
          { "id": "tohsl71eo", "weight": 210, "reps": 8, "restSeconds": 90 }
        ]
      },
      {
        "id": "f7p07wakf",
        "exerciseId": "seated-leg-curl-machine",
        "exerciseName": "Seated Leg Curl (Machine)",
        "category": "legs",
        "sets": [
          { "id": "9kci0bxui", "weight": 100, "reps": 15, "restSeconds": 90 },
          { "id": "4auvt78fu", "weight": 105, "reps": 8, "restSeconds": 90 },
          { "id": "zfp4cl6se", "weight": 105, "reps": 5, "restSeconds": 90 }
        ]
      }
    ]
  },
  {
    "id": "pduamgujj",
    "name": "Fireman Carry",
    "exercises": [
      {
        "id": "1itp5r61u",
        "exerciseId": "modified-curl-up",
        "exerciseName": "Modified Curl-up",
        "category": "arms",
        "sets": [
          { "id": "yxn7jw8pb", "weight": 0, "reps": 5, "restSeconds": 90 },
          { "id": "2clrub9ep", "weight": 0, "reps": 5, "restSeconds": 90 }
        ]
      },
      {
        "id": "mudqtdc7y",
        "exerciseId": "bird-dog",
        "exerciseName": "Bird Dog",
        "category": "chest",
        "sets": [
          { "id": "tzar151ds", "weight": 0, "reps": 6, "restSeconds": 90 },
          { "id": "82t2vvtdq", "weight": 0, "reps": 5, "restSeconds": 90 }
        ]
      },
      {
        "id": "01iboucp9",
        "exerciseId": "trap-bar-deadlift",
        "exerciseName": "Trap Bar Deadlift",
        "category": "back",
        "sets": [
          { "id": "0kqeuwza7", "weight": 105, "reps": 8, "restSeconds": 90 },
          { "id": "73y7hr8cx", "weight": 105, "reps": 10, "restSeconds": 90 },
          { "id": "3suy1rdad", "weight": 105, "reps": 10, "restSeconds": 90 },
          { "id": "as7p534s0", "weight": 105, "reps": 10, "restSeconds": 90 }
        ]
      },
      {
        "id": "fpfwvh3e6",
        "exerciseId": "goblet-squat-kettlebell",
        "exerciseName": "Goblet Squat (Kettlebell)",
        "category": "legs",
        "sets": [
          { "id": "nqocdi2hf", "weight": 30, "reps": 10, "restSeconds": 90 },
          { "id": "qflwp0bs5", "weight": 30, "reps": 10, "restSeconds": 90 },
          { "id": "kgy4bhg94", "weight": 35, "reps": 7, "restSeconds": 90 }
        ]
      },
      {
        "id": "lye1cpfv7",
        "exerciseId": "glute-ham-raise",
        "exerciseName": "Glute Ham Raise",
        "category": "legs",
        "sets": [
          { "id": "15bge3irw", "weight": 0, "reps": 10, "restSeconds": 90 },
          { "id": "iw4zlevds", "weight": 0, "reps": 10, "restSeconds": 90 }
        ]
      }
    ]
  },
  {
    "id": "1626j8h2m",
    "name": "Core & Biceps",
    "exercises": [
      {
        "id": "8rj0vnkkx",
        "exerciseId": "preacher-curl-barbell",
        "exerciseName": "Preacher Curl (Barbell)",
        "category": "arms",
        "sets": [
          { "id": "0ohpwcklb", "weight": 65, "reps": 8, "restSeconds": 90 },
          { "id": "7ac8lc3p0", "weight": 65, "reps": 8, "restSeconds": 90 },
          { "id": "4us1o41h5", "weight": 65, "reps": 8, "restSeconds": 90 }
        ]
      },
      {
        "id": "cmctx032e",
        "exerciseId": "torso-rotation-machine",
        "exerciseName": "Torso Rotation (Machine)",
        "category": "chest",
        "sets": [
          { "id": "etevx3upr", "weight": 125, "reps": 15, "restSeconds": 90 },
          { "id": "ht6yc4ot5", "weight": 130, "reps": 12, "restSeconds": 90 },
          { "id": "0lssofxgu", "weight": 130, "reps": 15, "restSeconds": 90 }
        ]
      },
      {
        "id": "c4ghmbv9b",
        "exerciseId": "bicep-curl-cable",
        "exerciseName": "Bicep Curl (Cable)",
        "category": "arms",
        "sets": [
          { "id": "uuqa39i58", "weight": 27.5, "reps": 6, "restSeconds": 90 },
          { "id": "ekebgkes2", "weight": 27.5, "reps": 8, "restSeconds": 90 },
          { "id": "m2lcv7bd9", "weight": 27.5, "reps": 5, "restSeconds": 90 }
        ]
      },
      {
        "id": "1dj1fjl1q",
        "exerciseId": "knee-raise-captain-s-chair",
        "exerciseName": "Knee Raise (Captain's Chair)",
        "category": "chest",
        "sets": [
          { "id": "t3ga7u2v5", "weight": 0, "reps": 11, "restSeconds": 90 },
          { "id": "wbl0tg9ms", "weight": 0, "reps": 10, "restSeconds": 90 },
          { "id": "q3sunrpd4", "weight": 0, "reps": 9, "restSeconds": 90 }
        ]
      },
      {
        "id": "azri01hqc",
        "exerciseId": "hammer-curl-cable",
        "exerciseName": "Hammer Curl (Cable)",
        "category": "arms",
        "sets": [
          { "id": "eakb0j349", "weight": 25, "reps": 10, "restSeconds": 90 },
          { "id": "t1t8xo2zo", "weight": 25, "reps": 9, "restSeconds": 90 },
          { "id": "3ylnlq5n7", "weight": 25, "reps": 6, "restSeconds": 90 }
        ]
      },
      {
        "id": "zval6srf8",
        "exerciseId": "decline-crunch",
        "exerciseName": "Decline Crunch",
        "category": "cardio",
        "sets": [
          { "id": "m9uty6zsq", "weight": 0, "reps": 12, "restSeconds": 90 },
          { "id": "wcd1868zb", "weight": 0, "reps": 10, "restSeconds": 90 },
          { "id": "p2j6qrkog", "weight": 0, "reps": 7, "restSeconds": 90 }
        ]
      }
    ]
  }
];
