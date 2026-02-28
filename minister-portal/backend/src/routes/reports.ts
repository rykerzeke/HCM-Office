import path from 'node:path';
import fs from 'node:fs';
import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';

const prisma = new PrismaClient();

// Margins in inches -> points (72 pt = 1 inch)
const MARGIN_TOP = 0.68 * 72;
const MARGIN_BOTTOM = 0.34 * 72;
const MARGIN_LEFT = 0.6 * 72;
const MARGIN_RIGHT = 0.6 * 72;

const PRIORITY_COLORS: Record<string, string> = {
  LOW: '#6b7280',     // gray
  MEDIUM: '#3b82f6',  // blue
  HIGH: '#f97316',    // orange
  URGENT: '#ef4444',  // red
};

const auth = [async (request: any, reply: any) => {
  try { await request.jwtVerify(); } catch (err) { return reply.send(err); }
}];

export default async function reportRoutes(fastify: FastifyInstance) {
  fastify.get('/reports', {
    preValidation: auth
  }, async (_request, reply) => {
    const districtWise = await prisma.case.groupBy({
      by: ['status'],
      _count: { id: true }
    });

    const workload = await prisma.assignment.groupBy({
      by: ['userId'],
      _count: { id: true }
    });

    return reply.send({
      districtWise,
      workload
    });
  });

  // PDF export: Lora font, margins, priority colour coding
  fastify.get('/reports/pdf', {
    preValidation: auth
  }, async (_request, reply) => {
    const districtWise = await prisma.case.groupBy({
      by: ['status'],
      _count: { id: true }
    });
    const workload = await prisma.assignment.groupBy({
      by: ['userId'],
      _count: { id: true }
    });
    const cases = await prisma.case.findMany({
      include: { citizen: { select: { name: true, phone: true } } },
      orderBy: { createdAt: 'desc' }
    });

    const loraPath = path.join(__dirname, '../../fonts/Lora-Regular.ttf');
    const useLora = fs.existsSync(loraPath);

    const doc = new PDFDocument({ margin: 0 });
    reply.header('Content-Type', 'application/pdf');
    reply.header('Content-Disposition', 'attachment; filename="minister-portal-report.pdf"');
    doc.pipe(reply.raw);

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const contentWidth = pageWidth - MARGIN_LEFT - MARGIN_RIGHT;
    const contentTop = MARGIN_TOP;
    const contentBottom = pageHeight - MARGIN_BOTTOM;

    if (useLora) {
      doc.font(loraPath);
    } else {
      doc.font('Helvetica');
    }

    let y = contentTop;
    const lineHeight = 14;
    const sectionGap = 20;

    function checkNewPage(needed: number) {
      if (y + needed > contentBottom) {
        doc.addPage();
        y = contentTop;
      }
    }

    doc.fontSize(18).fillColor('#1e293b').text('Minister Portal – Analytics & Reports', MARGIN_LEFT, y);
    y += lineHeight + 8;
    doc.fontSize(10).fillColor('#64748b').text(new Date().toLocaleString(), MARGIN_LEFT, y);
    y += lineHeight + sectionGap;

    doc.fontSize(14).fillColor('#1e293b').text('Cases by Status', MARGIN_LEFT, y);
    y += lineHeight + 6;
    for (const item of districtWise) {
      checkNewPage(lineHeight + 4);
      doc.fontSize(10).fillColor('#334155').text(`${item.status.replace(/_/g, ' ')}: ${item._count.id}`, MARGIN_LEFT, y);
      y += lineHeight;
    }
    y += sectionGap;

    doc.fontSize(14).fillColor('#1e293b').text('Officer Workload', MARGIN_LEFT, y);
    y += lineHeight + 6;
    for (const item of workload) {
      checkNewPage(lineHeight + 4);
      doc.fontSize(10).fillColor('#334155').text(`${item.userId.substring(0, 8)}... : ${item._count.id} assigned`, MARGIN_LEFT, y);
      y += lineHeight;
    }
    y += sectionGap;

    doc.fontSize(14).fillColor('#1e293b').text('Cases / Tasks by Priority', MARGIN_LEFT, y);
    y += lineHeight + 8;

    const colWidths = [contentWidth * 0.2, contentWidth * 0.45, contentWidth * 0.2, contentWidth * 0.15];
    const tableLeft = MARGIN_LEFT;
    const headerY = y;
    doc.fontSize(9).fillColor('#475569');
    doc.text('Case ID', tableLeft, headerY);
    doc.text('Purpose', tableLeft + colWidths[0], headerY);
    doc.text('Citizen', tableLeft + colWidths[0] + colWidths[1], headerY);
    doc.text('Priority', tableLeft + colWidths[0] + colWidths[1] + colWidths[2], headerY);
    y += lineHeight + 4;

    for (const c of cases) {
      checkNewPage(lineHeight + 6);
      const priority = c.priority || 'MEDIUM';
      const hex = PRIORITY_COLORS[priority] || PRIORITY_COLORS.MEDIUM;
      doc.fillColor(hex);
      doc.fontSize(9).text(c.caseId, tableLeft, y, { width: colWidths[0], ellipsis: true });
      doc.fillColor('#334155');
      doc.text((c.purpose || '').substring(0, 50) + (c.purpose && c.purpose.length > 50 ? '…' : ''), tableLeft + colWidths[0], y, { width: colWidths[1], ellipsis: true });
      doc.text(c.citizen?.name || '—', tableLeft + colWidths[0] + colWidths[1], y, { width: colWidths[2], ellipsis: true });
      doc.fillColor(hex);
      doc.text(priority, tableLeft + colWidths[0] + colWidths[1] + colWidths[2], y, { width: colWidths[3] });
      doc.fillColor('#334155');
      y += lineHeight + 4;
    }

    doc.end();
  });

  // Excel export
  fastify.get('/reports/excel', {
    preValidation: auth
  }, async (_request, reply) => {
    const districtWise = await prisma.case.groupBy({
      by: ['status'],
      _count: { id: true }
    });
    const workload = await prisma.assignment.groupBy({
      by: ['userId'],
      _count: { id: true }
    });
    const cases = await prisma.case.findMany({
      include: { citizen: { select: { name: true, phone: true } } },
      orderBy: { createdAt: 'desc' }
    });

    const wb = new ExcelJS.Workbook();
    wb.creator = 'Minister Portal';

    const wsStatus = wb.addWorksheet('Cases by Status');
    wsStatus.columns = [
      { header: 'Status', key: 'status', width: 28 },
      { header: 'Count', key: 'count', width: 12 }
    ];
    wsStatus.addRows(districtWise.map((r: any) => ({ status: r.status.replace(/_/g, ' '), count: r._count.id })));

    const wsWorkload = wb.addWorksheet('Officer Workload');
    wsWorkload.columns = [
      { header: 'User ID', key: 'userId', width: 40 },
      { header: 'Assigned', key: 'count', width: 12 }
    ];
    wsWorkload.addRows(workload.map((r: any) => ({ userId: r.userId, count: r._count.id })));

    const wsCases = wb.addWorksheet('Cases');
    wsCases.columns = [
      { header: 'Case ID', key: 'caseId', width: 18 },
      { header: 'Priority', key: 'priority', width: 12 },
      { header: 'Status', key: 'status', width: 22 },
      { header: 'Citizen', key: 'citizenName', width: 24 },
      { header: 'Phone', key: 'phone', width: 14 },
      { header: 'Purpose', key: 'purpose', width: 50 }
    ];
    for (const c of cases) {
      const row = wsCases.addRow({
        caseId: c.caseId,
        priority: c.priority || 'MEDIUM',
        status: (c.status || '').replace(/_/g, ' '),
        citizenName: c.citizen?.name || '',
        phone: c.citizen?.phone || '',
        purpose: (c.purpose || '').substring(0, 200)
      });
      const priority = c.priority || 'MEDIUM';
      const hex = PRIORITY_COLORS[priority] || PRIORITY_COLORS.MEDIUM;
      row.getCell(2).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF' + hex.replace('#', '') }
      };
    }

    const buffer = await wb.xlsx.writeBuffer();
    reply.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    reply.header('Content-Disposition', 'attachment; filename="minister-portal-report.xlsx"');
    return reply.send(Buffer.from(buffer));
  });
}
