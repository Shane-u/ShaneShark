import { useState } from 'react'
import type { FormEvent } from 'react'
import styled from 'styled-components'
import { Modal, message } from 'antd'
import { checkQaAdminEmailOrSendCode, loginOrRegisterQaAdminByEmail, loginQaAdmin } from '@/services/qaApi'

/**
 * LoginWidget renders a fixed top-right login button that opens a modal form.
 * 使用示例：<LoginWidget />（MainLayout 中引入，固定右上角登录入口）
 */
export function LoginWidget() {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [useEmailMode, setUseEmailMode] = useState(false)
  const [emailExists, setEmailExists] = useState<boolean | null>(null)
  const [emailChecking, setEmailChecking] = useState(false)
  const [emailCode, setEmailCode] = useState('')

  const handleOpen = () => setOpen(true)
  const handleClose = () => {
    setOpen(false)
    setEmail('')
    setPassword('')
    setUseEmailMode(false)
    setEmailExists(null)
    setEmailChecking(false)
    setEmailCode('')
  }

  const handleToggleMode = () => {
    setUseEmailMode((prev) => !prev)
    setEmailExists(null)
    setEmailChecking(false)
    setEmailCode('')
  }

  const handleCheckEmailOrSendCode = async () => {
    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      message.warning('请先输入邮箱地址')
      return
    }
    setEmailChecking(true)
    try {
      const exists = await checkQaAdminEmailOrSendCode(trimmedEmail)
      setEmailExists(exists)
      if (!exists) {
        message.success('验证码已发送到邮箱，请查收')
      } else {
        message.info('该邮箱已注册，将直接使用邮箱 + 密码登录')
      }
    } catch {
      message.error('发送或检查邮箱失败，请稍后重试')
    } finally {
      setEmailChecking(false)
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedEmail = email.trim()
    const trimmedPassword = password.trim()

    if (!trimmedPassword) {
      message.warning('请输入密码')
      return
    }

    setSubmitting(true)
    try {
      if (!useEmailMode) {
        // 原有：仅管理员口令登录
        const success = await loginQaAdmin(trimmedPassword)
        if (success) {
          message.success('登录成功，管理员权限已解锁')
          handleClose()
        } else {
          message.error('账号或密码错误')
        }
        return
      }

      // 新增：邮箱模式
      if (!trimmedEmail) {
        message.warning('请输入邮箱地址')
        return
      }

      const success = await loginOrRegisterQaAdminByEmail({
        email: trimmedEmail,
        password: trimmedPassword,
        // 当邮箱不存在时必须带上验证码
        code: emailExists === false ? emailCode.trim() || undefined : undefined,
      })

      if (success) {
        message.success('登录成功，管理员权限已解锁')
        handleClose()
      }
    } catch {
      message.error('登录失败，请稍后重试')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <StyledButtonWrapper>
        <button type="button" onClick={handleOpen}>
          Login
        </button>
      </StyledButtonWrapper>
      <Modal
        title="登录以继续"
        // 当前项目使用 antd v4，因此用 visible 控制显隐
        visible={open}
        onCancel={handleClose}
        footer={null}
        destroyOnClose
        maskClosable={false}
      >
        <StyledForm onSubmit={handleSubmit}>
          <div className="title">
            Welcome,
            <br />
            <span>{useEmailMode ? '使用邮箱登录或注册管理员' : '输入管理员口令以继续'}</span>
          </div>
          <div className="mode-toggle">
            <button
              type="button"
              className={`mode-btn ${!useEmailMode ? 'active' : ''}`}
              onClick={handleToggleMode}
            >
              口令登录
            </button>
            <button
              type="button"
              className={`mode-btn ${useEmailMode ? 'active' : ''}`}
              onClick={handleToggleMode}
            >
              邮箱验证码
            </button>
          </div>
          <input
            type="email"
            placeholder="Email"
            name="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          {useEmailMode && (
            <>
              <div className="code-row">
                <input
                  type="text"
                  placeholder="邮箱验证码（新邮箱必填）"
                  name="code"
                  className="input"
                  value={emailCode}
                  onChange={(e) => setEmailCode(e.target.value)}
                  maxLength={6}
                />
                <button
                  type="button"
                  className="code-button"
                  onClick={handleCheckEmailOrSendCode}
                  disabled={emailChecking}
                  aria-label="发送或检查验证码"
                >
                  {emailChecking ? '...' : 'Code'}
                </button>
              </div>
            </>
          )}
          <input
            type="password"
            placeholder="Password"
            name="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          <div className="login-with">
            <button type="button" className="button-log" aria-label="Sign in with Apple">
              
            </button>
            <button type="button" className="button-log" aria-label="Sign in with Google">
              <svg
                className="icon"
                height="56.6934px"
                viewBox="0 0 56.6934 56.6934"
                width="56.6934px"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M51.981,24.4812c-7.7173-0.0038-15.4346-0.0019-23.1518-0.001c0.001,3.2009-0.0038,6.4018,0.0019,9.6017  c4.4693-0.001,8.9386-0.0019,13.407,0c-0.5179,3.0673-2.3408,5.8723-4.9258,7.5991c-1.625,1.0926-3.492,1.8018-5.4168,2.139  c-1.9372,0.3306-3.9389,0.3729-5.8713-0.0183c-1.9651-0.3921-3.8409-1.2108-5.4773-2.3649  c-2.6166-1.8383-4.6135-4.5279-5.6388-7.5549c-1.0484-3.0788-1.0561-6.5046,0.0048-9.5805  c0.7361-2.1679,1.9613-4.1705,3.5708-5.8002c1.9853-2.0324,4.5664-3.4853,7.3473-4.0811c2.3812-0.5083,4.8921-0.4113,7.2234,0.294  c1.9815,0.6016,3.8082,1.6874,5.3044,3.1163c1.5125-1.5039,3.0173-3.0164,4.527-4.5231c0.7918-0.811,1.624-1.5865,2.3908-2.4196  c-2.2928-2.1218-4.9805-3.8274-7.9172-4.9056C32.0723,4.0363,26.1097,3.995,20.7871,5.8372  C14.7889,7.8907,9.6815,12.3763,6.8497,18.0459c-0.9859,1.9536-1.7057,4.0388-2.1381,6.1836  C3.6238,29.5732,4.382,35.2707,6.8468,40.1378c1.6019,3.1768,3.8985,6.001,6.6843,8.215c2.6282,2.0958,5.6916,3.6439,8.9396,4.5078  c4.0984,1.0993,8.461,1.0743,12.5864,0.1355c3.7284-0.8581,7.256-2.6397,10.0725-5.24c2.977-2.7358,5.1006-6.3403,6.2249-10.2138  C52.5807,33.3171,52.7498,28.8064,51.981,24.4812z" />
              </svg>
            </button>
            <button type="button" className="button-log" aria-label="Sign in with Facebook">
              <svg
                className="icon"
                height="56.693px"
                viewBox="0 0 56.693 56.693"
                width="56.693px"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M40.43,21.739h-7.645v-5.014c0-1.883,1.248-2.322,2.127-2.322c0.877,0,5.395,0,5.395,0V6.125l-7.43-0.029  c-8.248,0-10.125,6.174-10.125,10.125v5.518h-4.77v8.53h4.77c0,10.947,0,24.137,0,24.137h10.033c0,0,0-13.32,0-24.137h6.77  L40.43,21.739z" />
              </svg>
            </button>
          </div>
          <button className="button-confirm" type="submit" disabled={submitting}>
            {submitting ? '登录中...' : "Let’s go →"}
          </button>
        </StyledForm>
      </Modal>
    </>
  )
}

const StyledButtonWrapper = styled.div`
  button {
    font: inherit;
    background-color: #f0f0f0;
    border: 0;
    color: #242424;
    border-radius: 0.5em;
    font-size: 1.35rem;
    padding: 0.375em 1em;
    font-weight: 600;
    text-shadow: 0 0.0625em 0 #fff;
    box-shadow: inset 0 0.0625em 0 0 #f4f4f4, 0 0.0625em 0 0 #efefef, 0 0.125em 0 0 #ececec,
      0 0.25em 0 0 #e0e0e0, 0 0.3125em 0 0 #dedede, 0 0.375em 0 0 #dcdcdc, 0 0.425em 0 0 #cacaca,
      0 0.425em 0.5em 0 #cecece;
    transition: 0.15s ease;
    cursor: pointer;
  }

  button:active {
    translate: 0 0.225em;
    box-shadow: inset 0 0.03em 0 0 #f4f4f4, 0 0.03em 0 0 #efefef, 0 0.0625em 0 0 #ececec,
      0 0.125em 0 0 #e0e0e0, 0 0.125em 0 0 #dedede, 0 0.2em 0 0 #dcdcdc, 0 0.225em 0 0 #cacaca,
      0 0.225em 0.375em 0 #cecece;
  }
`

const StyledForm = styled.form`
  --input-focus: #2d8cf0;
  --font-color: #323232;
  --font-color-sub: #666;
  --bg-color: #fff;
  --main-color: #323232;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 20px;

  .title {
    color: var(--font-color);
    font-weight: 900;
    font-size: 20px;
    margin-bottom: 10px;
    line-height: 1.3;
  }

  .title span {
    color: var(--font-color-sub);
    font-weight: 600;
    font-size: 17px;
  }

  .input {
    width: 100%;
    height: 40px;
    border-radius: 5px;
    border: 2px solid var(--main-color);
    background-color: var(--bg-color);
    box-shadow: 4px 4px var(--main-color);
    font-size: 15px;
    font-weight: 600;
    color: var(--font-color);
    padding: 5px 10px;
    outline: none;
  }

  .input::placeholder {
    color: var(--font-color-sub);
    opacity: 0.8;
  }

  .input:focus {
    border: 2px solid var(--input-focus);
  }

  .login-with {
    display: flex;
    gap: 20px;
  }

  .mode-toggle {
    display: flex;
    gap: 8px;
    width: 100%;
    margin-top: 4px;
  }

  .mode-btn {
    flex: 1;
    height: 32px;
    border-radius: 999px;
    border: 2px solid var(--main-color);
    background-color: var(--bg-color);
    box-shadow: 3px 3px var(--main-color);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
  }

  .mode-btn.active {
    background-color: #0f172a;
    color: #fff;
  }

  .code-row {
    display: flex;
    gap: 8px;
    width: 100%;
    align-items: center;
  }

  .code-button {
    cursor: pointer;
    min-width: 70px;
    height: 40px;
    border-radius: 999px;
    border: 2px solid var(--main-color);
    background-color: var(--bg-color);
    box-shadow: 4px 4px var(--main-color);
    font-size: 14px;
    font-weight: 600;
  }

  .code-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .button-log {
    cursor: pointer;
    width: 40px;
    height: 40px;
    border-radius: 100%;
    border: 2px solid var(--main-color);
    background-color: var(--bg-color);
    box-shadow: 4px 4px var(--main-color);
    color: var(--font-color);
    font-size: 25px;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .icon {
    width: 24px;
    height: 24px;
    fill: var(--main-color);
  }

  .button-log:active,
  .button-confirm:active {
    box-shadow: 0px 0px var(--main-color);
    transform: translate(3px, 3px);
  }

  .button-confirm {
    margin: 10px auto 0 auto;
    width: 120px;
    height: 40px;
    border-radius: 5px;
    border: 2px solid var(--main-color);
    background-color: var(--bg-color);
    box-shadow: 4px 4px var(--main-color);
    font-size: 17px;
    font-weight: 600;
    color: var(--font-color);
    cursor: pointer;
  }

  .button-confirm:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

export default LoginWidget

