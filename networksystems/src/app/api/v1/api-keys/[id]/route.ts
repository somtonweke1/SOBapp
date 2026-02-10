import { NextRequest, NextResponse } from 'next/server';
import { withApiMiddleware } from '@/lib/api-middleware';
import { prisma } from '@/lib/prisma';

/**
 * DELETE /api/v1/api-keys/:id
 * Revoke/delete an API key
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withApiMiddleware(
    request,
    async (context) => {
      const apiKey = await prisma.apiKey.findUnique({
        where: { id: params.id },
      });

      if (!apiKey) {
        return NextResponse.json(
          { success: false, error: 'API key not found' },
          { status: 404 }
        );
      }

      // Check ownership
      if (apiKey.userId !== context.userId) {
        return NextResponse.json(
          { success: false, error: 'Access denied' },
          { status: 403 }
        );
      }

      await prisma.apiKey.delete({
        where: { id: params.id },
      });

      // Log deletion
      await prisma.auditLog.create({
        data: {
          userId: context.userId,
          action: 'delete_api_key',
          resource: 'api_key',
          resourceId: params.id,
          details: JSON.stringify({ name: apiKey.name }),
          timestamp: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: 'API key deleted successfully',
      });
    },
    {
      rateLimit: 'api',
      logRequest: true,
      resource: 'api_keys',
    }
  );
}

/**
 * PATCH /api/v1/api-keys/:id
 * Update API key (deactivate/activate)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withApiMiddleware(
    request,
    async (context) => {
      const apiKey = await prisma.apiKey.findUnique({
        where: { id: params.id },
      });

      if (!apiKey) {
        return NextResponse.json(
          { success: false, error: 'API key not found' },
          { status: 404 }
        );
      }

      // Check ownership
      if (apiKey.userId !== context.userId) {
        return NextResponse.json(
          { success: false, error: 'Access denied' },
          { status: 403 }
        );
      }

      const body = await request.json();
      const { isActive } = body;

      const updated = await prisma.apiKey.update({
        where: { id: params.id },
        data: { isActive },
      });

      return NextResponse.json({
        success: true,
        data: {
          id: updated.id,
          name: updated.name,
          isActive: updated.isActive,
        },
        message: `API key ${isActive ? 'activated' : 'deactivated'} successfully`,
      });
    },
    {
      rateLimit: 'api',
      logRequest: true,
      resource: 'api_keys',
    }
  );
}
