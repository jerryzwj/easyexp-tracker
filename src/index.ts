import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { jwt } from 'hono/jwt'
import { hashPassword, comparePassword } from './utils/password'
import * as XLSX from 'xlsx'

type Env = {
  DB: D1Database
  JWT_SECRET: string
}

type Variables = {
  userId: string
}

const app = new Hono<{ Bindings: Env; Variables: Variables }>()

app.use('*', cors())

// Helper
function generateId(): string {
  return crypto.randomUUID()
}

// Auth middleware
app.use('/api/expenses/*', async (c, next) => {
  const authHeader = c.req.header('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: '未授权访问' }, 401)
  }
  const token = authHeader.substring(7)
  try {
    const payload = await jwt({ secret: c.env.JWT_SECRET })(c, next)
    return payload
  } catch {
    return c.json({ error: '未授权访问' }, 401)
  }
})

app.use('/api/config*', async (c, next) => {
  const authHeader = c.req.header('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: '未授权访问' }, 401)
  }
  const token = authHeader.substring(7)
  try {
    const payload = await jwt({ secret: c.env.JWT_SECRET })(c, next)
    return payload
  } catch {
    return c.json({ error: '未授权访问' }, 401)
  }
})

app.use('/api/auth/change-password', async (c, next) => {
  const authHeader = c.req.header('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: '未授权访问' }, 401)
  }
  const token = authHeader.substring(7)
  try {
    const payload = await jwt({ secret: c.env.JWT_SECRET })(c, next)
    return payload
  } catch {
    return c.json({ error: '未授权访问' }, 401)
  }
})

function getUserId(c: any): string {
  return c.get('jwtPayload')?.sub || ''
}

// ============ Auth Routes ============

// Register
app.post('/api/auth/register', async (c) => {
  try {
    const { username, password } = await c.req.json()

    if (!username || !password) {
      return c.json({ error: '用户名和密码不能为空' }, 400)
    }

    if (password.length < 6) {
      return c.json({ error: '密码长度至少为6位' }, 400)
    }

    const existingUser = await c.env.DB.prepare('SELECT id FROM users WHERE username = ?').bind(username).first()
    if (existingUser) {
      return c.json({ error: '用户名已存在' }, 400)
    }

    const hashedPassword = await hashPassword(password)
    const userId = generateId()
    const now = new Date().toISOString()

    await c.env.DB
      .prepare('INSERT INTO users (id, username, password, create_time) VALUES (?, ?, ?, ?)')
      .bind(userId, username, hashedPassword, now)
      .run()

    // Generate JWT using hono/jwt style
    const { sign } = await import('hono/jwt')
    const token = await sign({ sub: userId }, c.env.JWT_SECRET)

    return c.json({
      message: '注册成功',
      user: { id: userId, username },
      token,
    }, 201)
  } catch (error) {
    console.error('注册失败:', error)
    return c.json({ error: '注册失败' }, 500)
  }
})

// Login
app.post('/api/auth/login', async (c) => {
  try {
    const { username, password } = await c.req.json()

    if (!username || !password) {
      return c.json({ error: '用户名和密码不能为空' }, 400)
    }

    const existingUser = await c.env.DB.prepare('SELECT * FROM users WHERE username = ?').bind(username).first()
    if (!existingUser) {
      return c.json({ error: '用户名或密码错误' }, 401)
    }

    const isPasswordValid = await comparePassword(password, existingUser.password as string)
    if (!isPasswordValid) {
      return c.json({ error: '用户名或密码错误' }, 401)
    }

    const { sign } = await import('hono/jwt')
    const token = await sign({ sub: existingUser.id as string }, c.env.JWT_SECRET)

    return c.json({
      message: '登录成功',
      user: { id: existingUser.id, username: existingUser.username },
      token,
    })
  } catch (error) {
    console.error('登录失败:', error)
    return c.json({ error: '登录失败' }, 500)
  }
})

// Logout (client-side, just return success)
app.post('/api/auth/logout', async (c) => {
  return c.json({ message: '登出成功' })
})

// Change password
app.post('/api/auth/change-password', async (c) => {
  try {
    const { currentPassword, newPassword } = await c.req.json()
    const payload = c.get('jwtPayload')
    const userId = payload.sub

    if (!currentPassword || !newPassword) {
      return c.json({ error: '请提供当前密码和新密码' }, 400)
    }

    if (newPassword.length < 6) {
      return c.json({ error: '新密码长度至少为6位' }, 400)
    }

    const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first()
    if (!user) {
      return c.json({ error: '用户不存在' }, 404)
    }

    const isPasswordValid = await comparePassword(currentPassword, user.password as string)
    if (!isPasswordValid) {
      return c.json({ error: '当前密码错误' }, 401)
    }

    const hashedPassword = await hashPassword(newPassword)
    await c.env.DB.prepare('UPDATE users SET password = ? WHERE id = ?').bind(hashedPassword, userId).run()

    return c.json({ message: '密码修改成功' })
  } catch (error) {
    console.error('修改密码失败:', error)
    return c.json({ error: '修改密码失败' }, 500)
  }
})

// ============ Expenses Routes ============

// Get expenses list
app.get('/api/expenses', async (c) => {
  try {
    const payload = c.get('jwtPayload')
    const userId = payload.sub

    const page = parseInt(c.req.query('page') || '1')
    const limit = parseInt(c.req.query('limit') || '10')
    const startDate = c.req.query('startDate')
    const endDate = c.req.query('endDate')
    const reimburseType = c.req.query('reimburseType')
    const payType = c.req.query('payType')

    const conditions: string[] = ['user_id = ?']
    const params: any[] = [userId]

    if (startDate) {
      conditions.push('date >= ?')
      params.push(startDate)
    }
    if (endDate) {
      conditions.push('date <= ?')
      params.push(endDate)
    }
    if (reimburseType) {
      conditions.push('reimburse_type = ?')
      params.push(reimburseType)
    }
    if (payType) {
      conditions.push('pay_type = ?')
      params.push(payType)
    }

    const whereClause = conditions.join(' AND ')
    const offset = (page - 1) * limit

    const countResult = await c.env.DB
      .prepare(`SELECT COUNT(*) as total FROM expenses WHERE ${whereClause}`)
      .bind(...params)
      .first()

    const { results } = await c.env.DB
      .prepare(
        `SELECT id, user_id, amount, reimburse_type, reimburse_amount, pay_type, date, other, create_time, update_time
         FROM expenses WHERE ${whereClause}
         ORDER BY date DESC LIMIT ? OFFSET ?`
      )
      .bind(...params, limit, offset)
      .all()

    const expenses = results.map((row: any) => ({
      _id: row.id,
      userId: row.user_id,
      amount: row.amount,
      reimburseType: row.reimburse_type,
      reimburseAmount: row.reimburse_amount,
      payType: row.pay_type,
      date: row.date,
      other: row.other,
      createTime: row.create_time,
      updateTime: row.update_time,
    }))

    return c.json({ expenses, total: (countResult as any).total, page, limit })
  } catch (error) {
    console.error('获取支出记录失败:', error)
    return c.json({ error: '获取支出记录失败' }, 500)
  }
})

// Create expense
app.post('/api/expenses', async (c) => {
  try {
    const payload = c.get('jwtPayload')
    const userId = payload.sub

    const { amount, reimburseType, reimburseAmount, payType, date, other } = await c.req.json()

    if (!amount || !reimburseType || !payType || !date) {
      return c.json({ error: '金额、报销类型、支付类型和日期不能为空' }, 400)
    }

    const expenseId = generateId()
    const now = new Date().toISOString()

    await c.env.DB
      .prepare(
        `INSERT INTO expenses (id, user_id, amount, reimburse_type, reimburse_amount, pay_type, date, other, create_time)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        expenseId,
        userId,
        amount,
        reimburseType,
        reimburseAmount || null,
        payType,
        date,
        other || null,
        now
      )
      .run()

    return c.json({ message: '支出记录创建成功', expenseId }, 201)
  } catch (error) {
    console.error('创建支出记录失败:', error)
    return c.json({ error: '创建支出记录失败' }, 500)
  }
})

// Get expense by id
app.get('/api/expenses/:id', async (c) => {
  try {
    const payload = c.get('jwtPayload')
    const userId = payload.sub
    const id = c.req.param('id')

    const expense = await c.env.DB
      .prepare(
        'SELECT id, user_id, amount, reimburse_type, reimburse_amount, pay_type, date, other, create_time, update_time FROM expenses WHERE id = ? AND user_id = ?'
      )
      .bind(id, userId)
      .first()

    if (!expense) {
      return c.json({ error: '支出记录不存在' }, 404)
    }

    return c.json({
      _id: expense.id,
      userId: expense.user_id,
      amount: expense.amount,
      reimburseType: expense.reimburse_type,
      reimburseAmount: expense.reimburse_amount,
      payType: expense.pay_type,
      date: expense.date,
      other: expense.other,
      createTime: expense.create_time,
      updateTime: expense.update_time,
    })
  } catch (error) {
    console.error('获取支出记录失败:', error)
    return c.json({ error: '获取支出记录失败' }, 500)
  }
})

// Update expense
app.put('/api/expenses/:id', async (c) => {
  try {
    const payload = c.get('jwtPayload')
    const userId = payload.sub
    const id = c.req.param('id')

    const { amount, reimburseType, reimburseAmount, payType, date, other } = await c.req.json()
    const now = new Date().toISOString()

    const result = await c.env.DB
      .prepare(
        `UPDATE expenses SET amount = ?, reimburse_type = ?, reimburse_amount = ?, pay_type = ?, date = ?, other = ?, update_time = ?
         WHERE id = ? AND user_id = ?`
      )
      .bind(
        amount,
        reimburseType,
        reimburseAmount || null,
        payType,
        date,
        other || null,
        now,
        id,
        userId
      )
      .run()

    if (result.meta.changes === 0) {
      return c.json({ error: '支出记录不存在' }, 404)
    }

    return c.json({ message: '支出记录更新成功' })
  } catch (error) {
    console.error('更新支出记录失败:', error)
    return c.json({ error: '更新支出记录失败' }, 500)
  }
})

// Delete expense
app.delete('/api/expenses/:id', async (c) => {
  try {
    const payload = c.get('jwtPayload')
    const userId = payload.sub
    const id = c.req.param('id')

    const result = await c.env.DB
      .prepare('DELETE FROM expenses WHERE id = ? AND user_id = ?')
      .bind(id, userId)
      .run()

    if (result.meta.changes === 0) {
      return c.json({ error: '支出记录不存在' }, 404)
    }

    return c.json({ message: '支出记录删除成功' })
  } catch (error) {
    console.error('删除支出记录失败:', error)
    return c.json({ error: '删除支出记录失败' }, 500)
  }
})

// Stats
app.get('/api/expenses/stats', async (c) => {
  try {
    const payload = c.get('jwtPayload')
    const userId = payload.sub

    const startDate = c.req.query('startDate')
    const endDate = c.req.query('endDate')
    const reimburseType = c.req.query('reimburseType')
    const payType = c.req.query('payType')

    const conditions: string[] = ['user_id = ?']
    const params: any[] = [userId]

    if (startDate) {
      conditions.push('date >= ?')
      params.push(startDate)
    }
    if (endDate) {
      conditions.push('date <= ?')
      params.push(endDate)
    }
    if (reimburseType) {
      conditions.push('reimburse_type = ?')
      params.push(reimburseType)
    }
    if (payType) {
      conditions.push('pay_type = ?')
      params.push(payType)
    }

    const whereClause = conditions.join(' AND ')

    const { results } = await c.env.DB
      .prepare(`SELECT amount, reimburse_type, reimburse_amount FROM expenses WHERE ${whereClause}`)
      .bind(...params)
      .all()

    let totalExpense = 0
    let pendingReimburse = 0
    let reimbursed = 0

    for (const exp of results as any[]) {
      totalExpense += exp.amount || 0
      if (exp.reimburse_type === '待报销') {
        pendingReimburse += exp.amount || 0
      }
      if (exp.reimburse_type === '已报销') {
        reimbursed += exp.reimburse_amount || 0
      }
    }

    const balance = totalExpense - reimbursed

    return c.json({ totalExpense, pendingReimburse, reimbursed, balance })
  } catch (error) {
    console.error('获取统计数据失败:', error)
    return c.json({ error: '获取统计数据失败' }, 500)
  }
})

// Export
app.get('/api/expenses/export', async (c) => {
  try {
    const payload = c.get('jwtPayload')
    const userId = payload.sub

    const startDate = c.req.query('startDate')
    const endDate = c.req.query('endDate')
    const reimburseType = c.req.query('reimburseType')
    const payType = c.req.query('payType')

    const conditions: string[] = ['user_id = ?']
    const params: any[] = [userId]

    if (startDate) {
      conditions.push('date >= ?')
      params.push(startDate)
    }
    if (endDate) {
      conditions.push('date <= ?')
      params.push(endDate)
    }
    if (reimburseType) {
      conditions.push('reimburse_type = ?')
      params.push(reimburseType)
    }
    if (payType) {
      conditions.push('pay_type = ?')
      params.push(payType)
    }

    const whereClause = conditions.join(' AND ')

    const { results } = await c.env.DB
      .prepare(
        `SELECT date, amount, reimburse_type, pay_type, reimburse_amount, other
         FROM expenses WHERE ${whereClause}
         ORDER BY date DESC`
      )
      .bind(...params)
      .all()

    const exportData = (results as any[]).map((expense: any) => ({
      日期: expense.date,
      金额: expense.amount,
      报销类型: expense.reimburse_type,
      支付类型: expense.pay_type,
      报销金额: expense.reimburse_amount || '',
      备注: expense.other || '',
    }))

    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(exportData)
    worksheet['!cols'] = [{ wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 30 }]
    XLSX.utils.book_append_sheet(workbook, worksheet, '支出记录')

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })

    return new Response(excelBuffer as Uint8Array, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename=expenses.xlsx',
      },
    })
  } catch (error) {
    console.error('导出支出记录失败:', error)
    return c.json({ error: '导出支出记录失败' }, 500)
  }
})

// ============ Config Routes ============

app.get('/api/config', async (c) => {
  try {
    const payload = c.get('jwtPayload')
    const userId = payload.sub

    const { results } = await c.env.DB
      .prepare('SELECT type, options FROM configs WHERE user_id = ?')
      .bind(userId)
      .all()

    const config: Record<string, any> = {
      reimburseTypes: [],
      payTypes: [],
    }

    for (const row of results as any[]) {
      try {
        const options = JSON.parse(row.options)
        if (row.type === 'reimburseType') {
          config.reimburseTypes = options
        } else if (row.type === 'payType') {
          config.payTypes = options
        }
      } catch {
        // skip invalid JSON
      }
    }

    return c.json(config)
  } catch (error) {
    console.error('获取配置失败:', error)
    return c.json({ error: '获取配置失败' }, 500)
  }
})

app.put('/api/config', async (c) => {
  try {
    const payload = c.get('jwtPayload')
    const userId = payload.sub

    const { type, options } = await c.req.json()
    if (!type || !options || !Array.isArray(options)) {
      return c.json({ error: '无效的配置参数' }, 400)
    }

    if (!['reimburseType', 'payType'].includes(type)) {
      return c.json({ error: '无效的配置类型' }, 400)
    }

    const now = new Date().toISOString()
    const optionsJson = JSON.stringify(options)

    const existing = await c.env.DB
      .prepare('SELECT id FROM configs WHERE user_id = ? AND type = ?')
      .bind(userId, type)
      .first()

    if (existing) {
      await c.env.DB
        .prepare('UPDATE configs SET options = ?, update_time = ? WHERE user_id = ? AND type = ?')
        .bind(optionsJson, now, userId, type)
        .run()
    } else {
      const configId = generateId()
      await c.env.DB
        .prepare('INSERT INTO configs (id, user_id, type, options, update_time) VALUES (?, ?, ?, ?, ?)')
        .bind(configId, userId, type, optionsJson, now)
        .run()
    }

    return c.json({ message: '配置更新成功' })
  } catch (error) {
    console.error('更新配置失败:', error)
    return c.json({ error: '更新配置失败' }, 500)
  }
})

// Health check
app.get('/', (c) => {
  return c.text('EasyExp API is running!')
})

export default app
