export interface Particle {
  size: number;
  position: { top?: string; bottom?: string; left?: string; right?: string };
  animation: string;
  opacity: number;
}

// 预定义的位置配置，避免服务端渲染不一致
const positions = [
  // 左上象限
  { top: "15%", left: "25%" },
  { top: "25%", left: "15%" },
  { top: "35%", left: "30%" },
  { top: "20%", left: "35%" },
  { top: "30%", left: "20%" },

  // 右上象限
  { top: "15%", right: "25%" },
  { top: "25%", right: "15%" },
  { top: "35%", right: "30%" },
  { top: "20%", right: "35%" },
  { top: "30%", right: "20%" },

  // 左下象限
  { bottom: "15%", left: "25%" },
  { bottom: "25%", left: "15%" },
  { bottom: "35%", left: "30%" },
  { bottom: "20%", left: "35%" },
  { bottom: "30%", left: "20%" },

  // 右下象限
  { bottom: "15%", right: "25%" },
  { bottom: "25%", right: "15%" },
  { bottom: "35%", right: "30%" },
  { bottom: "20%", right: "35%" },
  { bottom: "30%", right: "20%" },
];

// 预定义的大小配置 (原来的尺寸 * 4)
const sizes = [4, 8, 8, 12, 4, 8, 12, 4, 8, 8, 4, 12, 8, 4, 8, 12, 4, 8, 8, 4];

// 预定义的不透明度配置
const opacities = Array.from({ length: 20 }, (_, i) => 0.3 + (i % 5) * 0.1);

export const getParticles = () => {
  return positions.map((position, i) => ({
    size: sizes[i],
    position,
    animation: `float-${1 + (i % 8)}`,
    opacity: opacities[i],
  }));
};
