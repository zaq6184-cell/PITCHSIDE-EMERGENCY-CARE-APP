/** FIFA's own pages and documents. This guide links to them; it does not host copies. */
export const FIFA_EDUCATION_PAGE = "https://inside.fifa.com/health-and-medical/education-awareness";
export const FIFA_PITCHSIDE_CARE_PAGE = `${FIFA_EDUCATION_PAGE}/pitchside-emergency-care`;
export const FIFA_SCA_INFO_PAGE = `${FIFA_EDUCATION_PAGE}/sudden-cardiac-arrest`;
export const FIFA_COURSES_PAGE = `${FIFA_EDUCATION_PAGE}/football-medicine-courses`;

const hub = (id: string, file: string) => `https://digitalhub.fifa.com/m/${id}/original/${file}`;

export const fifaDownloads: { label: string; href: string }[] = [
  { label: "Pre-Match Emergency Action Plan (PEAP) poster", href: hub("4ae3f3f5b8c62bb6", "FIFA-Pre-match-Emergency-Action-Plan-PEAP.pdf") },
  { label: "Medical Set Piece — role cards", href: hub("6ba55c14845ba5b8", "FIFA-Medical-Set-Piece-Roles-within-the-Pre-Match-Emergency-Action-Plan.pdf") },
  { label: "Emergency protocol — sudden cardiac arrest", href: hub("70de10635046d5a4", "FIFA-Medical-Set-Piece-Emergency-Protocol-for-Sudden-Cardiac-Arrest.pdf") },
  { label: "Emergency protocol — cervical spine injury", href: hub("251163df71285d43", "FIFA-Medical-Set-Piece-Emergency-Protocol-for-Cervical-Spine-Injury.pdf") },
  { label: "Protocols for on-field interventions during matches", href: hub("2d07e67482901eb2", "FIFA-Medical-Set-Piece-Protocols-for-on-field-interventions-during-matches.pdf") },
  { label: "FIFA Emergency Care Manual", href: hub("1fc77540eab37831", "FIFA-Emergency-Care-Manual-EN.pdf") },
  { label: "Emergency Care Bag and AED factsheet", href: hub("234b69d94d8a67e5", "FIFA-Emergency-Care-Bag-and-AED-Factsheet.pdf") },
  { label: "FIFA's pitchside emergency care page", href: FIFA_PITCHSIDE_CARE_PAGE },
  { label: "FIFA's sudden cardiac arrest page", href: FIFA_SCA_INFO_PAGE },
  { label: "FIFA Emergency Medicine Course", href: FIFA_COURSES_PAGE },
];
