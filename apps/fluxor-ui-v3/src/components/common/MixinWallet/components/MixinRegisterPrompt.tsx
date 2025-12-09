/**
 * Mixin 注册提示对话框
 * 当用户已登录 Mixin 但未注册金融云时显示
 */
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";

interface MixinRegisterPromptProps {
  isOpen: boolean;
  onClose: () => void;
  onRegister: () => void;
}

export function MixinRegisterPrompt({ isOpen, onClose, onRegister }: MixinRegisterPromptProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-gray-600 border-colors-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">注册到 Mixin 金融云</DialogTitle>
          <DialogDescription className="text-gray-400">
            您需要注册 Mixin 金融云账户才能使用 Fluxor 借贷功能
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 信息提示框 */}
          <div className="bg-blue-500/10 border border-blue-500/50 rounded-md p-3">
            <div className="flex gap-2">
              <svg className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-blue-200">
                <strong>什么是 Mixin 金融云？</strong>
                <br />
                Mixin 金融云是去中心化的金融云服务，将您的 Mixin 钱包连接到 Solana 区块链。
                注册后即可在 Fluxor 上管理您的资产。
              </div>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <div className="bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mt-0.5">
                1
              </div>
              <div>
                <p className="font-medium text-white">连接您的 Mixin 钱包</p>
                <p className="text-gray-400">您已经登录 ✓</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <div className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mt-0.5">
                2
              </div>
              <div>
                <p className="font-medium text-white">注册到 Mixin 金融云</p>
                <p className="text-gray-400">访问 Fluxor 借贷功能必须完成注册</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <div className="bg-purple-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mt-0.5">
                3
              </div>
              <div>
                <p className="font-medium text-white">开始借贷赚取收益</p>
                <p className="text-gray-400">解锁所有 Fluxor 功能</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-md p-3">
            <p className="text-xs text-yellow-200">
              <strong>⚠️ 注意：</strong> 注册需要向 Mixin 金融云支付少量费用用于账户设置，这是一次性支付。
            </p>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose} className="border-gray-500 hover:bg-gray-700">
            稍后再说
          </Button>
          <Button onClick={onRegister} className="bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90">
            立即注册
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
