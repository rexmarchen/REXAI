import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const savedSearches = await prisma.savedSearch.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ success: true, savedSearches })
  } catch (error: any) {
    console.error('Failed to fetch saved searches:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch saved searches' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const name = String(body.name || '').trim()
    const filters = body.filters

    if (!name) {
      return NextResponse.json({ error: 'Search name is required' }, { status: 400 })
    }

    if (!filters || typeof filters !== 'object') {
      return NextResponse.json({ error: 'Valid filters object is required' }, { status: 400 })
    }

    const savedSearch = await prisma.savedSearch.create({
      data: {
        userId: session.user.id,
        name,
        filters,
      },
    })

    return NextResponse.json({ success: true, savedSearch })
  } catch (error: any) {
    console.error('Failed to create saved search:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to create saved search' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Saved search ID is required' }, { status: 400 })
  }

  try {
    await prisma.savedSearch.deleteMany({
      where: {
        id,
        userId: session.user.id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Failed to delete saved search:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to delete saved search' },
      { status: 500 }
    )
  }
}
