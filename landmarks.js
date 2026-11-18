export const places = [
  {
    name: '花石樓', en: 'Huashi Villa', key: 'villa',
    x: 0, z: 7, target: [3, 2.5, -24], fov: 49, marker: [68.2, 43],
    text: '花石樓矗立在八大關南側的海岬上，圓塔、拱窗和花崗岩外牆是它鮮明的地標。從梧桐濃蔭下走近，午後斜陽映亮了塔樓與石牆。',
    source: 'https://www.qingdao.gov.cn/zwgk/xxgk/whly/gkml/gzxx/202601/t20260126_10481040.shtml'
  },
  {
    name: '居庸關路', en: 'Juyongguan Road', key: 'avenue',
    x: -6, z: -29, target: [-6, 3, -78], fov: 64, marker: [50, 43],
    text: '深秋的居庸關路以銀杏聞名。沿著樹列向前，金黃色的枝葉在頭頂交會，兩側花園與別墅的圍牆從樹影中不時露出。',
    source: 'https://www.qingdao.gov.cn/zwgk/xxgk/whly/gkml/gzxx/202411/t20241118_8587681.shtml'
  },
  {
    name: '第二海水浴場', en: 'No. 2 Bathing Beach', key: 'shore',
    x: 28, z: 0, target: [39, .65, -24], fov: 66, marker: [59, 47],
    text: '第二海水浴場位於太平灣畔，與花石樓為鄰。從林蔭街道走向海岸，視野在沙灘與礁石間展開，黃海的細浪一層層推向岸邊。',
    source: 'https://www.qingdao.gov.cn/zwgk/xxgk/whly/gkml/gzxx/202606/t20260616_10636451.shtml'
  }
];

export function arrivalHeading(place) {
  return Math.atan2(place.target[0] - place.x, place.z - place.target[2]) * 180 / Math.PI;
}
