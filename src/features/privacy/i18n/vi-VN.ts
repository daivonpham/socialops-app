import type { TranslationShape } from '@/shared/i18n'
import type { privacyEnUS } from './en-US'

export const privacyViVN = {
  dataDeletion: {
    title: 'Xóa dữ liệu Facebook',
    completedTitle: 'Dữ liệu Facebook của bạn đã được xóa',
    completedDescription:
      'SocialOps đã xóa kết nối Facebook, các mã truy cập và số liệu Trang đã đồng bộ qua kết nối đó. Các Trang dùng kết nối này đã được ngắt kết nối.',
    code: 'Mã xác nhận',
    completedAt: 'Hoàn tất lúc',
    notFoundTitle: 'Không tìm thấy yêu cầu',
    notFoundDescription: 'Hãy kiểm tra lại liên kết từ Facebook. Mã xác nhận có thể bị thiếu.',
    error: 'Không tải được trạng thái. Vui lòng thử lại.',
  },
  legal: {
    home: 'Trang chủ SocialOps',
    updatedAt: 'Cập nhật lần cuối: {{date}}',
    contents: 'Mục lục',
    contactTitle: 'Liên hệ',
    contactBody: 'SocialOps do {{operator}} vận hành. Mọi câu hỏi và yêu cầu, vui lòng liên hệ:',
    email: 'Email',
    phone: 'Điện thoại',
    pages: 'Trang pháp lý',
    login: 'Đăng nhập',
  },
  privacyPolicy: {
    title: 'Chính sách quyền riêng tư',
    intro:
      'Chính sách này giải thích SocialOps thu thập dữ liệu gì, để làm gì, chia sẻ với ai, lưu bao lâu và cách bạn yêu cầu xóa. Chính sách áp dụng cho ứng dụng web SocialOps và các kết nối Facebook, TikTok, Google mà bạn tạo trong đó.',
    sections: {
      controller: {
        title: 'Ai chịu trách nhiệm về dữ liệu của bạn',
        body: 'SocialOps do cá nhân {{operator}} vận hành, là bên quyết định việc xử lý dữ liệu cá nhân của bạn. Liên hệ: {{email}}, {{phone}}.',
      },
      dataCollected: {
        title: 'Dữ liệu chúng tôi thu thập',
        body: `- Tài khoản: họ tên, email và mật khẩu (chỉ lưu dạng băm một chiều). Nếu bạn đăng nhập bằng Google, chúng tôi nhận họ tên, email và ảnh đại diện từ Google.
- Workspace và thương hiệu: các workspace, thương hiệu bạn tạo, thành viên, vai trò và lời mời.
- Nội dung bạn tạo: bài viết, chú thích, lịch đăng, ảnh và video bạn tải lên, bình luận sẽ đăng, báo cáo và cấu hình báo cáo.
- Trợ lý AI: yêu cầu bạn gửi, các cuộc trò chuyện và nội dung được tạo cho bạn.
- Dữ liệu kỹ thuật: phiên đăng nhập, địa chỉ IP, loại trình duyệt, nhật ký lỗi và nhật ký các thao tác quan trọng, dùng để giữ dịch vụ an toàn và hoạt động ổn định.`,
      },
      facebookData: {
        title: 'Dữ liệu từ Facebook',
        body: `Khi kết nối Facebook, bạn tự chọn những Trang SocialOps được truy cập. Chúng tôi chỉ xin các quyền mà tính năng cần:

- pages_show_list: liệt kê các Trang bạn quản lý để bạn chọn Trang cần kết nối.
- pages_manage_posts: đăng, hẹn giờ, sửa và xóa bài trên các Trang đã kết nối, chỉ khi bạn hoặc nhóm của bạn yêu cầu.
- pages_read_engagement và pages_read_user_content: đọc bài viết, cảm xúc và bình luận của Trang để hiển thị trong SocialOps.
- read_insights: đọc số liệu thống kê của Trang và bài viết cho bảng điều khiển và báo cáo.
- pages_manage_engagement (không bắt buộc): đăng bình luận đầu tiên bạn viết dưới bài của chính bạn.

Chúng tôi lưu tên, ID và ảnh của Trang, mã truy cập Trang đã mã hóa, các bài viết của Trang và số liệu của chúng. Dữ liệu Facebook chỉ dùng để cung cấp các tính năng trên cho workspace đã kết nối Trang. Dữ liệu không được bán, không dùng cho quảng cáo và không dùng để huấn luyện mô hình AI.`,
      },
      otherIntegrations: {
        title: 'Dữ liệu từ TikTok và Google',
        body: `- TikTok: khi bạn kết nối tài khoản TikTok, chúng tôi chỉ xin những quyền tính năng cần: user.info.basic, user.info.profile và user.info.stats (tên, username, ảnh đại diện, tiểu sử, dấu xác minh và số người theo dõi, đang theo dõi, lượt thích, số video), video.list (các video công khai cùng lượt xem, thích, bình luận, chia sẻ), video.publish (đăng video và bài ảnh bạn yêu cầu) và, không bắt buộc, video.upload (gửi bản nháp vào hộp thư TikTok của bạn). Chúng tôi lưu mã truy cập đã mã hóa, hồ sơ, các video công khai và bản ghi số liệu theo ngày để vẽ thống kê theo thời gian. Nếu bạn gỡ SocialOps trong TikTok, TikTok sẽ báo cho chúng tôi và tài khoản được ngắt kết nối.
- Google Sheets: khi bạn xuất báo cáo sang Google Sheets, chúng tôi chỉ xin quyền truy cập các tệp do SocialOps tạo (drive.file). Chúng tôi không xem được phần còn lại trong Google Drive của bạn.

Việc SocialOps sử dụng và chuyển giao thông tin nhận từ Google API tuân thủ Chính sách dữ liệu người dùng của Google API Services, bao gồm các yêu cầu về Giới hạn sử dụng (Limited Use).`,
      },
      use: {
        title: 'Chúng tôi dùng dữ liệu để làm gì',
        body: `- Vận hành tài khoản của bạn và các workspace bạn tham gia.
- Đăng, hẹn giờ nội dung và hiển thị số liệu, báo cáo cho các tài khoản bạn đã kết nối.
- Tạo gợi ý nội dung bằng trợ lý AI khi bạn yêu cầu.
- Gửi email dịch vụ như xác minh email, đặt lại mật khẩu và lời mời.
- Giữ dịch vụ an toàn, ngăn lạm dụng và sửa lỗi.

Chúng tôi không bán dữ liệu của bạn và không dùng dữ liệu cho quảng cáo.`,
      },
      sharing: {
        title: 'Chúng tôi chia sẻ dữ liệu với ai',
        body: `Chúng tôi chỉ chia sẻ dữ liệu với các dịch vụ cần thiết để vận hành SocialOps, và chỉ phần mỗi dịch vụ cần:

- Meta (Facebook), TikTok và Google: để đăng nội dung và đọc dữ liệu của các tài khoản bạn đã kết nối.
- OpenAI: yêu cầu và nội dung bạn gửi cho trợ lý AI được xử lý để tạo câu trả lời.
- Cloudflare R2: lưu trữ ảnh và video bạn tải lên.
- Resend: gửi email dịch vụ.
- Grafana Cloud: giám sát kỹ thuật (số liệu hiệu năng và lỗi), không gồm nội dung bài viết của bạn.
- Các nhà cung cấp máy chủ và cơ sở dữ liệu vận hành SocialOps.

Chúng tôi cũng có thể cung cấp dữ liệu khi pháp luật hoặc cơ quan có thẩm quyền yêu cầu.`,
      },
      retention: {
        title: 'Chúng tôi lưu dữ liệu bao lâu',
        body: `Tài khoản và nội dung được lưu trong thời gian tài khoản còn tồn tại. Một số dữ liệu được tự động xóa sớm hơn:

- Cuộc trò chuyện với trợ lý AI: 30 ngày.
- Phiên đăng nhập: 30 ngày sau khi kết thúc.
- Số liệu của tài khoản Facebook hoặc TikTok đã ngắt kết nối: 90 ngày sau khi ngắt.
- Lịch sử đăng bài, lịch sử làm mới báo cáo và lời mời đã hết hạn: 90 ngày.
- Nhật ký bảo mật: 365 ngày.`,
      },
      deletion: {
        title: 'Xóa dữ liệu của bạn',
        body: `- Ngắt kết nối Trang hoặc tài khoản trong SocialOps bất cứ lúc nào. Mã truy cập bị xóa ngay, số liệu bị xóa sau thời hạn nêu trên.
- Gỡ SocialOps khỏi Facebook (Cài đặt và quyền riêng tư > Cài đặt > Tiện ích tích hợp cho doanh nghiệp). Facebook sẽ gửi yêu cầu xóa cho chúng tôi: chúng tôi xóa kết nối, các mã truy cập và số liệu Trang đã đồng bộ qua kết nối đó, và cấp cho bạn mã xác nhận để kiểm tra trạng thái.
- Để xóa toàn bộ tài khoản SocialOps và mọi dữ liệu, hãy gửi email tới {{email}} từ địa chỉ email của tài khoản. Chúng tôi hoàn tất yêu cầu trong vòng 30 ngày.`,
      },
      rights: {
        title: 'Quyền của bạn',
        body: 'Bạn có quyền yêu cầu xem, sửa, xuất hoặc xóa dữ liệu cá nhân, rút lại sự đồng ý đã đưa ra hoặc phản đối việc xử lý, bằng cách gửi email tới {{email}}. Chúng tôi phản hồi trong vòng 30 ngày. Bạn cũng có thể khiếu nại tới cơ quan có thẩm quyền về bảo vệ dữ liệu cá nhân.',
      },
      security: {
        title: 'Bảo mật',
        body: 'Kết nối dùng HTTPS. Mật khẩu được băm, mã truy cập Facebook, TikTok và Google được mã hóa khi lưu. Quyền truy cập trong workspace theo vai trò do chủ workspace phân công. Không hệ thống nào an toàn tuyệt đối, nhưng chúng tôi luôn bảo vệ dữ liệu của bạn và sẽ thông báo khi có sự cố ảnh hưởng tới dữ liệu, theo quy định pháp luật.',
      },
      storage: {
        title: 'Cookie và bộ nhớ trình duyệt',
        body: 'SocialOps dùng một cookie bảo mật (HTTP-only) để giữ phiên đăng nhập, và bộ nhớ trình duyệt để ghi nhớ ngôn ngữ cùng workspace, thương hiệu bạn mở gần nhất. Chúng tôi không dùng cookie quảng cáo hay cookie theo dõi của bên thứ ba.',
      },
      children: {
        title: 'Trẻ em',
        body: 'SocialOps là công cụ cho doanh nghiệp, không dành cho người dưới 16 tuổi. Chúng tôi không chủ ý thu thập dữ liệu của trẻ em.',
      },
      changes: {
        title: 'Thay đổi chính sách',
        body: 'Chúng tôi có thể cập nhật chính sách này khi SocialOps thay đổi. Ngày ở đầu trang cho biết phiên bản mới nhất. Nếu thay đổi quan trọng, chúng tôi sẽ báo trong ứng dụng hoặc qua email trước khi áp dụng.',
      },
    },
  },
  terms: {
    title: 'Điều khoản dịch vụ',
    intro:
      'Các điều khoản này quy định việc bạn sử dụng SocialOps, công cụ lập kế hoạch, đăng bài và báo cáo nội dung mạng xã hội. Vui lòng đọc cùng Chính sách quyền riêng tư.',
    sections: {
      acceptance: {
        title: 'Chấp nhận điều khoản',
        body: 'Khi tạo tài khoản, đăng nhập hoặc sử dụng SocialOps, bạn đồng ý với các điều khoản này và Chính sách quyền riêng tư. Nếu dùng SocialOps thay mặt doanh nghiệp, bạn xác nhận mình có quyền chấp nhận điều khoản cho doanh nghiệp đó.',
      },
      service: {
        title: 'Dịch vụ',
        body: 'SocialOps do {{operator}} vận hành. Dịch vụ giúp nhóm của bạn lập kế hoạch và đăng nội dung lên các tài khoản mạng xã hội bạn kết nối, dùng trợ lý AI để soạn nội dung, và xem số liệu, báo cáo. Tính năng có thể thay đổi trong quá trình phát triển sản phẩm.',
      },
      accounts: {
        title: 'Tài khoản của bạn',
        body: `- Cung cấp thông tin chính xác và giữ bí mật mật khẩu. Bạn chịu trách nhiệm về hoạt động trong tài khoản của mình.
- Chủ và quản trị viên workspace quyết định ai được tham gia workspace và vai trò của từng thành viên.
- Báo cho chúng tôi qua {{email}} nếu bạn nghi ngờ tài khoản bị sử dụng trái phép.`,
      },
      connectedPlatforms: {
        title: 'Nền tảng được kết nối',
        body: 'Khi kết nối Facebook, TikTok hoặc Google, bạn cho phép SocialOps thao tác trên các tài khoản đó như mô tả trong Chính sách quyền riêng tư. Bạn phải có quyền quản lý các tài khoản mình kết nối và vẫn phải tuân thủ điều khoản riêng của các nền tảng đó. SocialOps không liên kết với hay được Meta, TikTok hoặc Google bảo trợ, và không chịu trách nhiệm về thay đổi hay sự cố phía họ.',
      },
      content: {
        title: 'Nội dung của bạn',
        body: 'Bạn sở hữu nội dung mình tạo hoặc tải lên. Bạn cho phép SocialOps lưu trữ, xử lý và đăng nội dung đó thay bạn, chỉ nhằm cung cấp dịch vụ. Bạn chịu trách nhiệm về nội dung của mình và phải có quyền đăng nội dung đó.',
      },
      ai: {
        title: 'Nội dung do AI tạo',
        body: 'Trợ lý AI có thể tạo nội dung không chính xác hoặc không phù hợp. Hãy xem lại mọi nội dung trước khi đăng. Bạn chịu trách nhiệm về nội dung mình chọn đăng.',
      },
      acceptableUse: {
        title: 'Sử dụng hợp lệ',
        body: `Bạn không được dùng SocialOps để:

- vi phạm pháp luật hoặc quy định của nền tảng được kết nối;
- đăng nội dung rác, gây hiểu lầm, thù ghét hoặc xâm phạm quyền của người khác;
- truy cập tài khoản hoặc dữ liệu mà bạn không được phép dùng;
- làm gián đoạn, gây quá tải hoặc tìm cách phá vỡ bảo mật của dịch vụ.`,
      },
      availability: {
        title: 'Tính sẵn sàng',
        body: 'Chúng tôi cố gắng giữ SocialOps hoạt động liên tục nhưng không cam kết dịch vụ luôn sẵn sàng hay không có lỗi. Bài hẹn giờ có thể bị trễ hoặc thất bại khi nền tảng từ chối hoặc gặp sự cố; SocialOps hiển thị trạng thái từng bài để bạn xử lý.',
      },
      liability: {
        title: 'Giới hạn trách nhiệm',
        body: 'SocialOps được cung cấp "nguyên trạng". Trong phạm vi pháp luật cho phép, bên vận hành không chịu trách nhiệm về thiệt hại gián tiếp, mất lợi nhuận hay mất dữ liệu phát sinh từ việc sử dụng dịch vụ, kể cả từ các nền tảng được kết nối.',
      },
      termination: {
        title: 'Tạm ngưng và chấm dứt',
        body: 'Bạn có thể ngừng dùng SocialOps và yêu cầu xóa tài khoản bất cứ lúc nào. Chúng tôi có thể tạm ngưng hoặc đóng tài khoản vi phạm các điều khoản này, có báo trước khi hợp lý.',
      },
      changes: {
        title: 'Thay đổi điều khoản',
        body: 'Chúng tôi có thể cập nhật các điều khoản này. Ngày ở đầu trang cho biết phiên bản mới nhất. Nếu thay đổi quan trọng, chúng tôi sẽ báo trước khi áp dụng. Việc bạn tiếp tục dùng SocialOps sau đó nghĩa là bạn chấp nhận điều khoản mới.',
      },
      law: {
        title: 'Luật áp dụng',
        body: 'Các điều khoản này chịu sự điều chỉnh của pháp luật Việt Nam. Tranh chấp được giải quyết trước hết bằng thương lượng; nếu không thành, sẽ do tòa án có thẩm quyền tại Việt Nam giải quyết.',
      },
    },
  },
} as const satisfies TranslationShape<typeof privacyEnUS>
